import { core_config_schema } from "../../../schema/core/config";
import { ConfigCache } from "../../config";
import { get_plugins } from "../../plugin_registry";
import { define_plugin } from "../../types/plugin";
import { about_command } from "./command/about";
import { install_config_change_listener, load_configs } from "./config_sync";
import { install_wrapped_listener } from "./event_wrapper";
import { init_icons } from "./icon_sync";
import { prefix_delete_handler, prefix_edit_handler, prefix_send_handler } from "./prefix_engine";
import { slash_run_handler, sync_slash_commands } from "./slash_engine";

export const core_config = new ConfigCache(core_config_schema);

export const core_plugin = define_plugin({
	id: "core",
	commands: [about_command],
	config: core_config,
	listeners: [
		prefix_send_handler,
		prefix_edit_handler,
		prefix_delete_handler,
		slash_run_handler,
	],
	async apply() {
		await load_configs();
		await install_config_change_listener();
		await sync_slash_commands();
		await init_icons();

		for (const plugin of get_plugins()) {
			if (plugin.listeners !== undefined) {
				for (const listener of plugin.listeners)
					install_wrapped_listener(listener.type, listener.listener);
			}
		}
	},
});