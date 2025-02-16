import { connect_listener } from "../db/notification.ts";
import { bot } from "./index.ts";
import { core_plugin } from "./plugin/core/index.ts";
import { moderation_plugin } from "./plugin/moderation/index.ts";
import { util_plugin } from "./plugin/util/index.ts";
import { apply_plugins, register_plugin } from "./plugin_registry.ts";

async function main() {
	bot.once("ready", async () => {
		console.log("Loading plugins...");

		register_plugin(core_plugin);
		register_plugin(moderation_plugin);
		register_plugin(util_plugin);
		await apply_plugins();

		console.log("I'm ready :O");
	});

	await connect_listener();
	await bot.connect();
}

main();
