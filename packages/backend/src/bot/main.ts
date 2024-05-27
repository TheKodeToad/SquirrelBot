import { install_icon_listener } from "./core/icons";
import { apply_plugins, register_plugin } from "./core/plugin_registry";
import { bot } from "./index";
import { info_plugin } from "./plugin/info";
import { moderation_plugin } from "./plugin/moderation";
import { util_plugin } from "./plugin/util";

install_icon_listener();

bot.once("ready", async () => {
	console.log("I'm ready :O");

	register_plugin(info_plugin);
	register_plugin(moderation_plugin);
	register_plugin(util_plugin);
	await apply_plugins();
});

bot.connect();
