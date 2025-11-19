import type { SquirrelContext } from "#index.ts";
import { Client } from "oceanic.js";

export interface SquirrelDiscordContext extends SquirrelContext {
	bot: Client;
}
