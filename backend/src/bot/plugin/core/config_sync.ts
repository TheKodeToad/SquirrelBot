import AsyncLock from "async-lock";
import { parse as parseToml, TomlError } from "smol-toml";
import { safeParse } from "valibot";
import { map_iteratable } from "../../../common/iterators.ts";
import { module_logger } from "../../../common/logger/index.ts";
import { get_guild_config, insert_guild_config } from "../../../db/core/configs.ts";
import { add_channel_listener } from "../../../db/notification.ts";
import { get_plugin, get_plugins } from "../../loader/index.ts";
import type { Plugin } from "../../loader/plugin.ts";
import { add_grant_access_listener, add_revoke_access_listener, get_allowed_guilds } from "./guild_info_sync.ts";

const logger = module_logger();

export async function init_configs() {
	await Promise.all(map_iteratable(get_allowed_guilds(), create_and_load_configs));
	add_grant_access_listener(create_and_load_configs);
	add_revoke_access_listener(unload_configs);
	await install_config_change_listener();
}

const config_update_lock = new AsyncLock;

async function install_config_change_listener(): Promise<void> {
	await add_channel_listener("config_update", async payload => {
		if (payload === undefined)
			return;

		try {
			var { key, guild_id } = JSON.parse(payload);
		} catch (error) {
			if (!(error instanceof SyntaxError))
				throw error;

			logger.warn("Malformed JSON in config_update payload", error);
			return;
		}

		if (!(typeof key === "string" && typeof guild_id === "string")) {
			logger.warn("config_update payload does not conform to { key: string, guild_id: string; }");
			return;
		}

		await config_update_lock.acquire(guild_id, async () => {
			const plugin = get_plugin(key);

			if (plugin === undefined || plugin.config === undefined)
				return;

			await load_config(guild_id, plugin);
		});
	});
}

export async function create_and_load_configs(guild_id: string) {
	await config_update_lock.acquire(guild_id, async () => {
		for (const plugin of get_plugins()) {
			if (plugin.config === undefined)
				return;

			await insert_guild_config(guild_id, plugin.id, "");
			await load_config(guild_id, plugin);
		}
	});
}

export async function unload_configs(guild_id: string) {
	await config_update_lock.acquire(guild_id, async () => {
		for (const plugin of get_plugins()) {
			if (plugin.config === undefined)
				return;

			plugin.config.delete(guild_id);
		}
	});
}

async function load_config(guild_id: string, plugin: Plugin): Promise<void> {
	if (plugin.config === undefined)
		return;

	const raw_value = await get_guild_config(guild_id, plugin.id);

	if (raw_value === null) {
		plugin.config.delete(guild_id);
		return;
	}

	try {
		var table = parseToml(raw_value);
	} catch (error) {
		if (!(error instanceof TomlError))
			logger.error("Unexpected error parsing TOML (bug)", error);

		plugin.config.delete(guild_id);
		return;
	}

	try {
		var result = safeParse(plugin.config.schema, table);
	} catch (error) {
		// if our code is broken it might throw
		logger.error("Unexpected error in valibot safeParse (bug)", error);

		plugin.config.delete(guild_id);
		return;
	}

	if (!result.success || !result.typed) {
		plugin.config.delete(guild_id);
		return;
	}

	plugin.config.set(guild_id, result.output);
}