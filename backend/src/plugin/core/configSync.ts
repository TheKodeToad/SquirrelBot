import { debugFormatGuildByID } from "#common/discord/debugFormat.ts";
import { mapIterable } from "#common/iterators.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { getGuildConfig, insertGuildConfig } from "#db/core/configs.ts";
import { addChannelListener } from "#db/notification.ts";
import { getPlugin } from "#loader/index.ts";
import { CoreConfig } from "#plugin/core/config.ts";
import { addGrantAccessListener, addRevokeAccessListener, getAllowedGuilds, isGuildAllowed } from "#plugin/core/guildInfoSync.ts";
import type { ConfigStore } from "#plugin/core/public/configStore.ts";
import { defineConfig } from "#plugin/core/public/extensionPoints.ts";
import AsyncLock from "async-lock";
import { parse as parseToml, TomlError } from "smol-toml";
import { parse, safeParse, type InferInput } from "valibot";

const logger = moduleLogger();

export async function initConfigs(): Promise<void> {
	await Promise.all(mapIterable(getAllowedGuilds(), createAndLoadConfigs));
	addGrantAccessListener(createAndLoadConfigs);
	addRevokeAccessListener(unloadConfigs);
	await installConfigChangeListener();
}

const configUpdateLock = new AsyncLock;

function formatPluginInGuild(pluginID: string, guildID: string): string {
	return `#${pluginID} in ${debugFormatGuildByID(guildID)}`;
}

async function installConfigChangeListener(): Promise<void> {
	await addChannelListener("core_configUpdate", async payload => {
		if (payload === undefined)
			return;

		try {
			var payloadObject: unknown = JSON.parse(payload);
		} catch (error) {
			if (!(error instanceof SyntaxError))
				throw error;

			logger.warn?.("Malformed JSON in configUpdate payload", error);
			return;
		}

		if (typeof payloadObject !== "object" || payloadObject === null) {
			logger.warn?.("configUpdate payload is not an object");
			return;
		}

		if (!("key" in payloadObject && "guildID" in payloadObject)) {
			logger.warn?.("configUpdate payload does not contain key and guildID");
			return;
		}

		const { key, guildID } = payloadObject;

		if (!(typeof key === "string" && typeof guildID === "string")) {
			logger.warn?.("configUpdate payload contains non string values");
			return;
		}

		if (!isGuildAllowed(guildID)) {
			logger.debug?.(`${debugFormatGuildByID(guildID)} not allowed; not updating config`);
			return;
		}

		// TODO: don't lock all configs for each guild at a time
		await configUpdateLock.acquire(guildID, async () => {
			const plugin = getPlugin(key);

			if (plugin === undefined) {
				logger.warn?.(`Received configUpdate for plugin #${key} which does not exist`);
				return;
			}

			const config = defineConfig.contributions.get(plugin);

			if (config === undefined) {
				logger.warn?.(`Received configUpdate for plugin #${key} which does not have a config`);
				return;
			}

			logger.debug?.(`Updating config for plugin ${formatPluginInGuild(key, guildID)}`);

			await loadConfig(guildID, plugin.id, config.store);
		});
	});
}

async function createAndLoadConfigs(guildID: string): Promise<void> {
	await configUpdateLock.acquire(guildID, async () => {
		for (const [plugin, config] of defineConfig.contributions) {
			const inserted = await insertGuildConfig(guildID, plugin.id, config.defaultValue);

			if (inserted)
				logger.debug?.(`Creating config for plugin #${plugin.id} in ${debugFormatGuildByID(guildID)}`);

			await loadConfig(guildID, plugin.id, config.store);
		}
	});
}

async function unloadConfigs(guildID: string): Promise<void> {
	await configUpdateLock.acquire(guildID, () => {
		for (const config of defineConfig.contributions.values())
			config.store.delete(guildID);
	});
}

const coreConfigDefault = parse(CoreConfig, {} satisfies InferInput<typeof CoreConfig>);

async function loadConfig(guildID: string, pluginID: string, configStore: ConfigStore): Promise<void> {
	const value = await parseConfig(guildID, pluginID, configStore);

	if (value !== null)
		configStore.set(guildID, value);
	else {
		if (pluginID === "core")
			configStore.set(guildID, coreConfigDefault);
		else
			configStore.delete(guildID);
	}
}

async function parseConfig(guildID: string, pluginID: string, configCache: ConfigStore): Promise<{} | null> {
	const rawValue = await getGuildConfig(guildID, pluginID);

	if (rawValue === null)
		return null;

	try {
		var table = parseToml(rawValue);
	} catch (error) {
		if (!(error instanceof TomlError))
			logger.error?.("Unexpected error parsing TOML (bug)", error);
		else
			logger.debug?.(`Invalid TOML syntax in plugin config of ${formatPluginInGuild(pluginID, guildID)}`, error);

		return null;
	}

	if (pluginID !== "core") {
		if (typeof table.enabled !== "boolean") {
			logger.debug?.(`Missing { enabled: boolean; } in plugin config of ${formatPluginInGuild(pluginID, guildID)}`);
			return null;
		}

		if (table.enabled !== true)
			return null;
	}

	try {
		var result = safeParse(configCache.schema, table);
	} catch (error) {
		// if our code is broken it might throw
		logger.error?.("Unexpected error in valibot safeParse (bug)", error);
		return null;
	}

	if (!result.success || !result.typed) {
		logger.debug?.(`Validation failed for plugin config of #${pluginID} in ${debugFormatGuildByID(guildID)}`, result.issues);
		return null;
	}

	return result.output;
}
