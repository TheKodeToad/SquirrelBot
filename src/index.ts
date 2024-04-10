import { Client, CommandInteraction, GatewayIntentBits, GuildExplicitContentFilter, GuildVerificationLevel, Interaction, Message, Partials, PermissionFlagsBits, Routes } from "discord.js";
import { DISCORD_TOKEN } from "./config";
import { define_event_listener, EventListener } from "./plugin/types";
import { core_plugin } from "./plugins/core";
import { register_plugin, apply_plugins } from "./plugin/registry";
import { reminder_plugin } from "./plugins/reminder";

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
	register_plugin(reminder_plugin);
	await apply_plugins(client);
});

client.login(DISCORD_TOKEN);
