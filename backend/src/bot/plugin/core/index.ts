import { core_config_schema } from "../../../schema/core.ts";
import { get_plugins } from "../../loader/index.ts";
import { define_plugin } from "../../loader/plugin.ts";
import { about_command } from "./command/about.ts";
import { grant_access_command, revoke_access_command } from "./command/access.ts";
import { init_command_cache } from "./command_engine/command_cache.ts";
import { component_interaction_handler } from "./command_engine/component_engine.ts";
import { prefix_delete_handler, prefix_edit_handler, prefix_send_handler } from "./command_engine/prefix_engine.ts";
import { slash_run_handler, sync_slash_commands } from "./command_engine/slash_engine.ts";
import { init_configs } from "./config_sync.ts";
import { install_wrapped_listener } from "./event_wrapper.ts";
import { guild_info_sync_guild_create_handler, guild_info_sync_guild_update_handler, init_guild_info } from "./guild_info_sync.ts";
import { init_icons } from "./icon_sync.ts";
import { ConfigCache } from "./public/config.ts";

export const core_config = new ConfigCache(core_config_schema);

export const core_plugin = define_plugin({
	id: "core",
	config: core_config,
	commands: [about_command, grant_access_command, revoke_access_command],
	listeners: [
		prefix_send_handler,
		prefix_edit_handler,
		prefix_delete_handler,
		slash_run_handler,
		component_interaction_handler,
		guild_info_sync_guild_create_handler,
		guild_info_sync_guild_update_handler,
	],
	async apply() {
		init_command_cache();

		await init_guild_info();
		await init_configs();
		await sync_slash_commands();
		await init_icons();

		// TODO: is it a good idea to add listeners before the plugin is applied (no)
		for (const plugin of get_plugins())
			if (plugin.listeners !== undefined)
				for (const listener of plugin.listeners)
					install_wrapped_listener(listener.type, listener.listener);
	},
});