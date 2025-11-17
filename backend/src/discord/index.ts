import type { Context } from "#loader/index.ts";
import { Client } from "oceanic.js";

export interface DiscordContext extends Context {
	bot: Client;
}
