import { Client, CommandInteraction, GatewayIntentBits, Interaction, Message, Partials } from "discord.js";
import { DISCORD_TOKEN } from "./config";
import { define_event_listener, EventListener } from "./plugin/types";
import { core_plugin } from "./plugins/core";
import { register_plugin, apply_plugins } from "./plugin/registry";

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent
	],
	partials: [
		Partials.User,
		Partials.Channel,
		Partials.GuildMember,
		Partials.Message,
		Partials.Reaction,
		Partials.GuildScheduledEvent,
		Partials.ThreadMember
	],
	allowedMentions: {}
});

client.on("ready", async client => {
	console.log("I'm ready :O");

	register_plugin(core_plugin);
	await apply_plugins(client);
});

client.login(DISCORD_TOKEN);
