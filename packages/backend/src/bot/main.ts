import { apply_plugins, register_plugin } from "./core/plugin_registry";
import { bot } from "./index";
import { info_plugin } from "./plugin/info";
import { moderation_plugin } from "./plugin/moderation";

bot.once("shardPreReady", async () => {
	console.log("I'm ready :O");

	register_plugin(info_plugin);
	register_plugin(moderation_plugin);
	await apply_plugins();
});

bot.connect();
