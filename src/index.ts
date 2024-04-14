import { AllNonPrivilegedIntents, Client, Intents } from "oceanic.js";
import { DISCORD_TOKEN } from "./config";
import { apply_plugins, register_plugin } from "./plugin/registry";
import { core_plugin } from "./plugins/core";
import { moderation_plugin } from "./plugins/moderation";
import { reminder_plugin } from "./plugins/reminder";

const client = new Client({
	auth: `Bot ${DISCORD_TOKEN}`,
	gateway: {
		intents: AllNonPrivilegedIntents | Intents.MESSAGE_CONTENT
	},
	allowedMentions: {},
});

client.on("ready", async () => {
	console.log("I'm ready :O");

	register_plugin(core_plugin);
	register_plugin(moderation_plugin);
	register_plugin(reminder_plugin);
	await apply_plugins(client);
});

function exception_handler(error: unknown) {
	console.error("Unhandled exception!");
	console.error(error);
}

process.on("uncaughtException", exception_handler);
process.on("unhandledRejection", exception_handler);

client.connect();
