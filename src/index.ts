import { Client, Constants } from "oceanic.js";
import { Pool } from "pg";
import { DISCORD_TOKEN } from "./config";

export const client = new Client({
	auth: `Bot ${DISCORD_TOKEN}`,
	gateway: {
		intents: Constants.AllNonPrivilegedIntents | Constants.Intents.MESSAGE_CONTENT
	},
	allowedMentions: {},
});
export const pg = new Pool;
