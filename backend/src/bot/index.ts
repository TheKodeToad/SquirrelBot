import { Client, Constants } from "oceanic.js";
import { BOT_TOKEN } from "../environment.ts";

export const bot = new Client({
	auth: `Bot ${BOT_TOKEN}`,
	gateway: {
		intents:
			Constants.AllNonPrivilegedIntents
			| Constants.Intents.MESSAGE_CONTENT
			| Constants.Intents.GUILD_MEMBERS,
		lookupDisallowedIntents: true,
	},

	allowedMentions: {},
});
