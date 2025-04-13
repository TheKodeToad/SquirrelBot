import AsyncLock from "async-lock";
import { parse as parseToml, TomlError } from "smol-toml";
import { safeParse } from "valibot";
import { mapIterable } from "../../../common/iterators.ts";
import { moduleLogger } from "../../../common/logger/index.ts";
import { getGuildConfig, insertGuildConfig } from "../../../db/core/configs.ts";
import { addChannelListener } from "../../../db/notification.ts";
import { getPlugin, getPlugins } from "../../loader/index.ts";
import type { Plugin } from "../../loader/plugin.ts";
import { addGrantAccessListener, addRevokeAccessListener, getAllowedGuilds } from "./guildInfoSync.ts";

const logger = moduleLogger();

export async function initConfigs() {
	await Promise.all(mapIterable(getAllowedGuilds(), createAndLoadConfigs));
	addGrantAccessListener(createAndLoadConfigs);
	addRevokeAccessListener(unloadConfigs);
	await installConfigChangeListener();
}

const configUpdateLock = new AsyncLock;

async function installConfigChangeListener(): Promise<void> {
	await addChannelListener("core_configUpdate", async payload => {
		if (payload === undefined)
			return;

		try {
			var { key, guildID } = JSON.parse(payload);
		} catch (error) {
			if (!(error instanceof SyntaxError))
				throw error;

			logger.warn?.("Malformed JSON in configUpdate payload", error);
			return;
		}

		if (!(typeof key === "string" && typeof guildID === "string")) {
			logger.warn?.("configUpdate payload does not conform to { key: string, guildID: string; }");
			return;
		}

		await configUpdateLock.acquire(guildID, async () => {
			const plugin = getPlugin(key);

			if (plugin === undefined || plugin.config === undefined) {
				logger.debug?.(`Ignoring configUpdate for plugin '${key}'`);
				return;
			}

			logger.debug?.(`Updating config for plugin '${key}' in guild ${guildID}`);

			await loadConfig(guildID, plugin);
		});
	});
}

export async function createAndLoadConfigs(guildID: string) {
	await configUpdateLock.acquire(guildID, async () => {
		for (const plugin of getPlugins()) {
			if (plugin.config === undefined)
				return;

			await insertGuildConfig(guildID, plugin.id, "");
			await loadConfig(guildID, plugin);
		}
	});
}

export async function unloadConfigs(guildID: string) {
	await configUpdateLock.acquire(guildID, async () => {
		for (const plugin of getPlugins()) {
			if (plugin.config === undefined)
				return;

			plugin.config.delete(guildID);
		}
	});
}

async function loadConfig(guildID: string, plugin: Plugin): Promise<void> {
	if (plugin.config === undefined)
		return;

	const rawValue = await getGuildConfig(guildID, plugin.id);

	if (rawValue === null) {
		plugin.config.delete(guildID);
		return;
	}

	try {
		var table = parseToml(rawValue);
	} catch (error) {
		if (!(error instanceof TomlError))
			logger.error?.("Unexpected error parsing TOML (bug)", error);

		plugin.config.delete(guildID);
		return;
	}

	try {
		var result = safeParse(plugin.config.schema, table);
	} catch (error) {
		// if our code is broken it might throw
		logger.error?.("Unexpected error in valibot safeParse (bug)", error);

		plugin.config.delete(guildID);
		return;
	}

	if (!result.success || !result.typed) {
		plugin.config.delete(guildID);
		return;
	}

	plugin.config.set(guildID, result.output);
}