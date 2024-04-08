import { Client, CommandInteraction, GatewayIntentBits, Interaction, Message, Partials } from "discord.js";
import { DISCORD_TOKEN } from "./config";
import { register_command } from "./command/registry";
import { Context, FlagType } from "./command/types";
import { install_prefix_engine } from "./command/prefix_engine";
import { install_slash_engine } from "./command/slash_engine";

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

register_command({
	id: "bean",
	flags: {
		user: {
			type: FlagType.USER,
			id: "user",
			primary: true,
			required: true,
		},
		emoji: {
			type: FlagType.STRING,
			id: "emoji",
			required: true,
		}
	},
	async run(args, context) {
		const resolved_user = await client.users.fetch(args.user);
		await context.respond(`${args.emoji} Successfully beaned ${resolved_user.username}!`);
	},
});

client.on("ready", async () => {
	console.log("I'm ready :O");

	install_prefix_engine(client);
	await install_slash_engine(client);

	console.log("Added commands!");
});

client.login(DISCORD_TOKEN);
