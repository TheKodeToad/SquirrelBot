import AsyncLock from "async-lock";
import { parse as parseToml, TomlError } from "smol-toml";
import { safeParse } from "valibot";
import { bot } from "../..";
import { get_guild_config, insert_guild_config } from "../../../db/core/config";
import { add_channel_listener } from "../../../db/notification";
import { get_plugin, get_plugins } from "../../plugin_registry";
import { Plugin } from "../../types/plugin";

export async function load_configs() {
	console.log("Loading configs...");

	await Promise.all(bot.guilds.map(async guild => {
		for (const plugin of get_plugins()) {
			if (plugin.config === undefined)
				return;

			// TODO: might not scale well
			await insert_guild_config(guild.id, plugin.id, "");
			await load_config(guild.id, plugin);
		}
	}));


	console.log("Loaded configs!");
}

const config_update_lock = new AsyncLock;

export async function install_config_change_listener(): Promise<void> {
	await add_channel_listener("config_update", async payload => {
		if (payload === undefined)
			return;

		try {
			var { key, guild_id } = JSON.parse(payload);
		} catch (error) {
			if (!(error instanceof SyntaxError))
				throw error;

			// TODO: log warning
			return;
		}

		if (key === undefined || guild_id === undefined)
			return;

		config_update_lock.acquire([key, guild_id], async () => {
			const plugin = get_plugin(key);

			if (plugin === undefined || plugin.config === undefined)
				return;

			await load_config(guild_id, plugin);
		});
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
			throw error;

		plugin.config.delete(guild_id);
		return;
	}

	const result = safeParse(plugin.config.schema, table);

	if (!result.typed) {
		plugin.config.delete(guild_id);
		return;
	}

	plugin.config.set(guild_id, result.output);
}