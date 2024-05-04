import { apply_plugins, register_plugin } from "./core/plugin_registry";
import { bot } from "./index";
import { info_plugin } from "./plugin/info";
import { moderation_plugin } from "./plugin/moderation";
import { reminder_plugin } from "./plugin/reminder";

bot.once("shardPreReady", async () => {
	console.log("I'm ready :O");

	register_plugin(info_plugin);
	register_plugin(moderation_plugin);
	register_plugin(reminder_plugin);
	await apply_plugins();
});

function exception_handler(error: unknown) {
	// TODO do something cool B)
	console.error("Unhandled exception!");
	console.error(error);
}

bot.on("error", exception_handler);
process.on("uncaughtException", exception_handler);
process.on("unhandledRejection", exception_handler);

bot.connect();
