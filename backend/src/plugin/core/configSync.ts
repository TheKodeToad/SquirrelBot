import { debugFormatGuildByID } from "#common/discord/debugFormat.ts";
import { mapIterable } from "#common/general.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { getPlugin } from "#loader/index.ts";
import { CoreConfig } from "#plugin/core/config.ts";
import { getAllowedGuilds, isGuildAllowed, onGuildAccessGranted, onGuildAccessRevoked, onGuildInfoReady } from "#plugin/core/guildInfoSync.ts";
import type { ConfigStore } from "#plugin/core/public/configStore.ts";
import { defineConfig } from "#plugin/core/public/extensionPoints.ts";
import { getGuildConfig, insertGuildConfig } from "#plugin/core/storage/configs.ts";
import { addChannelListener } from "#storage/notification.ts";
import AsyncLock from "async-lock";
import { parse as parseToml, TomlError } from "smol-toml";
import { z } from "zod/v4";

const logger = moduleLogger();

export default [
	onGuildInfoReady(init),
	onGuildAccessGranted(createAndLoadConfigs),
	onGuildAccessRevoked(unloadConfigs),
];

async function init(): Promise<void> {
	await Promise.all(mapIterable(getAllowedGuilds(), createAndLoadConfigs));
	await installConfigChangeListener();
}

const configUpdateLock = new AsyncLock;

function formatGuildPlugin(guildID: string, pluginID: string): string {
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

		if (!("pluginID" in payloadObject && "guildID" in payloadObject)) {
			logger.warn?.("configUpdate payload does not contain pluginID and guildID");
			return;
		}

		const { guildID, pluginID } = payloadObject;

		if (!(typeof guildID === "string" && typeof pluginID === "string")) {
			logger.warn?.("configUpdate payload contains non string values");
			return;
		}

		if (!isGuildAllowed(guildID)) {
			logger.debug?.(`${debugFormatGuildByID(guildID)} not allowed; not updating config`);
			return;
		}

		// TODO: don't lock all configs for each guild at a time
		await configUpdateLock.acquire(guildID, async () => {
			const plugin = getPlugin(pluginID);

			if (plugin === undefined) {
				logger.warn?.(`Received configUpdate for plugin #${pluginID} which does not exist`);
				return;
			}

			const config = defineConfig.contributions.get(plugin);

			if (config === undefined) {
				logger.warn?.(`Received configUpdate for plugin #${pluginID} which does not have a config`);
				return;
			}

			logger.debug?.(`Updating config for plugin ${formatGuildPlugin(guildID, pluginID)}`);

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

const coreConfigDefault = CoreConfig.parse({} satisfies z.input<typeof CoreConfig>);

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
			logger.debug?.(`Invalid TOML syntax in plugin config of ${formatGuildPlugin(guildID, pluginID)}`, error);

		return null;
	}

	if (pluginID !== "core") {
		if (typeof table.enabled !== "boolean") {
			logger.debug?.(`Missing { enabled: boolean; } in plugin config of ${formatGuildPlugin(guildID, pluginID)}`);
			return null;
		}

		if (table.enabled !== true)
			return null;
	}

	delete table.enabled;

	try {
		var result = configCache.schema.safeParse(table);
	} catch (error) {
		// if our code is broken it might throw
		logger.error?.("Unexpected error in zod safeParse (bug)", error);
		return null;
	}

	if (!result.success) {
		logger.debug?.(`Validation failed for plugin config of #${pluginID} in ${debugFormatGuildByID(guildID)}`, z.prettifyError(result.error));
		return null;
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return result.data as any;
}
