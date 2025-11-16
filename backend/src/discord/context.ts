import { Client } from "oceanic.js";
import type { Pool } from "pg";

export interface DiscordContext {
	bot: Client;
	postgres: Pool;
	plugins: Map<string, Plugin>;
}
