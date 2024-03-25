import { Client, CommandInteraction, GatewayIntentBits, Interaction, Message, Partials } from "discord.js";
import { DISCORD_TOKEN } from "./config";
import { register_command } from "./command/registry";
import { Context, FlagType } from "./command/types";
import { install_prefix_engine } from "./command/prefix_engine";

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
		}
	},
	async run(context) {
		const user = await client.users.fetch(context.args.user);
		await context.respond(`:white_check_mark: Successfully beaned ${user.username}!`);
	},
});

install_prefix_engine(client);

client.on("ready", () => console.log("I'm ready :O"));

client.login(DISCORD_TOKEN);
