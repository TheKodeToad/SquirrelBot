import { core_config_schema } from "../../../schema/core.ts";
import { get_plugins } from "../../loader/index.ts";
import { define_plugin } from "../../loader/plugin.ts";
import { about_command } from "./command/about.ts";
import { install_config_change_listener, load_configs } from "./config_sync.ts";
import { install_wrapped_listener } from "./event_wrapper.ts";
import { init_guild_info } from "./guild_info_sync.ts";
import { init_icons } from "./icon_sync.ts";
import { prefix_delete_handler, prefix_edit_handler, prefix_send_handler } from "./prefix_engine.ts";
import { ConfigCache } from "./public/config.ts";
import { slash_run_handler, sync_slash_commands } from "./slash_engine.ts";

export const core_config = new ConfigCache(core_config_schema);

export const core_plugin = define_plugin({
	id: "core",
	config: core_config,
	commands: [about_command],
	listeners: [
		prefix_send_handler,
		prefix_edit_handler,
		prefix_delete_handler,
		slash_run_handler,
	],
	async apply() {
		await init_guild_info();
		await load_configs();
		await install_config_change_listener();
		await sync_slash_commands();
		await init_icons();

		for (const plugin of get_plugins())
			if (plugin.listeners !== undefined)
				for (const listener of plugin.listeners)
					install_wrapped_listener(listener.type, listener.listener);
	},
});