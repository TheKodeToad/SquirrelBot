import { debugFormatGuildByID } from "#common/discord/debugFormat.ts";
import { mapIterable, type Awaitable } from "#common/general.ts";
import { moduleLogger } from "#common/logger/index.ts";
import type { DiscordContext } from "#discord/index.ts";
import { CoreConfig } from "#plugin/core/config.ts";
import { getAllowedGuilds, isGuildAllowed, onGuildAccessGranted, onGuildAccessRevoked, onGuildInfoReady } from "#plugin/core/guildInfoSync.ts";
import type { ConfigStore } from "#plugin/core/public/configStore.ts";
import { defineConfig } from "#plugin/core/public/extensionPoints.ts";
import { getGuildConfig, insertGuildConfig } from "#plugin/core/storage/configs.ts";
import AsyncLock from "async-lock";
import type { Client } from "oceanic.js";
import { parse as parseToml, TomlError } from "smol-toml";
import { z } from "zod/v4";

const logger = moduleLogger();

export default [
	onGuildInfoReady(init),
	onGuildAccessGranted(createAndLoadConfigs),
	onGuildAccessRevoked((_, ctx) => unloadConfigs(ctx)),
];

async function init(ctx: DiscordContext): Promise<void> {
	await Promise.all(mapIterable(getAllowedGuilds(), guildID => createAndLoadConfigs(ctx, guildID)));
	await installConfigChangeListener(ctx);
}

const configUpdateLock = new AsyncLock;

function acquireConfig<T>(guildID: string, pluginID: string, action: () => Awaitable<T>): Promise<T> {
	return configUpdateLock.acquire(guildID + "::" + pluginID, action);
}

function formatGuildPlugin(bot: Client, guildID: string, pluginID: string): string {
	return `#${pluginID} in ${debugFormatGuildByID(bot, guildID)}`;
}

async function installConfigChangeListener(ctx: DiscordContext): Promise<void> {
	await ctx.dbNotifs.addListener("core_configUpdate", async payload => {
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
			logger.debug?.(`${debugFormatGuildByID(ctx.bot, guildID)} not allowed; not updating config`);
			return;
		}

		await acquireConfig(guildID, pluginID, async () => {
			const plugin = ctx.plugins.get(pluginID);

			if (plugin === undefined) {
				logger.warn?.(`Received configUpdate for plugin #${pluginID} which does not exist`);
				return;
			}

			const config = defineConfig.contributions.get(plugin);

			if (config === undefined) {
				logger.warn?.(`Received configUpdate for plugin #${pluginID} which does not have a config`);
				return;
			}

			logger.debug?.(`Updating config for plugin ${formatGuildPlugin(ctx.bot, guildID, pluginID)}`);

			await loadConfig(ctx, guildID, plugin.id, config.store);
		});
	});
}

async function createAndLoadConfigs(ctx: DiscordContext, guildID: string): Promise<void> {
	await Promise.all(defineConfig.contributions.entries().map(async ([plugin, config]) => {
			await acquireConfig(guildID, plugin.id, async () => {
				const inserted = await insertGuildConfig(ctx.db, guildID, plugin.id, config.defaultValue);

				if (inserted)
					logger.debug?.(`Creating config for plugin #${plugin.id} in ${debugFormatGuildByID(ctx.bot, guildID)}`);

				await loadConfig(ctx, guildID, plugin.id, config.store);
			});
	}));
}

async function unloadConfigs(guildID: string): Promise<void> {
	await Promise.all(defineConfig.contributions.entries().map(async ([plugin, config]) => {
		await acquireConfig(guildID, plugin.id, () => config.store.delete(guildID));
	}));
}

const coreConfigDefault = CoreConfig.parse({} satisfies z.input<typeof CoreConfig>);

async function loadConfig(ctx: DiscordContext, guildID: string, pluginID: string, configStore: ConfigStore): Promise<void> {
	const value = await parseConfig(ctx, guildID, pluginID, configStore);

	if (value !== null)
		configStore.set(guildID, value);
	else {
		if (pluginID === "core")
			configStore.set(guildID, coreConfigDefault);
		else
			configStore.delete(guildID);
	}
}

async function parseConfig(ctx: DiscordContext, guildID: string, pluginID: string, configCache: ConfigStore): Promise<{} | null> {
	const rawValue = await getGuildConfig(ctx.db, guildID, pluginID);

	if (rawValue === null)
		return null;

	try {
		var table = parseToml(rawValue);
	} catch (error) {
		if (!(error instanceof TomlError))
			logger.error?.("Unexpected error parsing TOML (bug)", error);
		else
			logger.debug?.(`Invalid TOML syntax in plugin config of ${formatGuildPlugin(ctx.bot, guildID, pluginID)}`, error);

		return null;
	}

	if (pluginID !== "core") {
		if (typeof table.enabled !== "boolean") {
			logger.debug?.(`Missing { enabled: boolean; } in plugin config of ${formatGuildPlugin(ctx.bot, guildID, pluginID)}`);
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
		logger.debug?.(`Validation failed for plugin config of #${pluginID} in ${debugFormatGuildByID(ctx.bot, guildID)}`, z.prettifyError(result.error));
		return null;
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return result.data as any;
}
