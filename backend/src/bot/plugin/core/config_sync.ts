import AsyncLock from "async-lock";
import { inspect } from "util";
import { flatten, safeParse } from "valibot";
import { bot } from "../..";
import { get_guild_config, insert_guild_config } from "../../../db/core/configs";
import { add_channel_listener } from "../../../db/notification";
import { get_plugin, get_plugins } from "../../plugin_registry";
import { Plugin } from "../../types/plugin";

export async function load_configs() {
	await Promise.all(bot.guilds.map(async guild => {
		for (const plugin of get_plugins()) {
			if (plugin.config === undefined)
				return;

			// TODO: might not scale well
			await insert_guild_config(guild.id, plugin.id, "");
			await load_config(guild.id, plugin);
		}
	}));
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

			console.warn("Malformed JSON in config_update payload", error);
			return;
		}

		if (!(typeof key === "string" && typeof guild_id === "string")) {
			console.warn("config_update payload does not conform to { key: string, guild_id: string; }");
			return;
		}

		config_update_lock.acquire([guild_id, key], async () => {
			const plugin = get_plugin(key);

			if (plugin === undefined || plugin.config === undefined)
				return;

			await load_config(guild_id, plugin);
		});
	});
}

async function load_config(guild_id: string, plugin: Plugin): Promise<void> {
	const { parse: parseToml, TomlError } = await import("smol-toml");

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
		if (!(error instanceof TomlError)) {
			console.error("Unexpected error parsing TOML (bug)");
			console.error(error);
		}

		plugin.config.delete(guild_id);
		return;
	}

	try {
		var result = safeParse(plugin.config.schema, table);
	} catch (error) {
		// if our code is broken it might throw
		console.error("Unexpected error in valibot safeParse (bug)");
		console.error(error);

		plugin.config.delete(guild_id);
		return;
	}

	if (!result.success || !result.typed) {
		console.log("error " + inspect(flatten(result.issues)));
		plugin.config.delete(guild_id);
		return;
	}

	plugin.config.set(guild_id, result.output);
}