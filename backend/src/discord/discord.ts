import type { BackendContext } from "#backend.ts";
import { Client } from "oceanic.js";

export interface BackendDiscordContext extends BackendContext {
	bot: Client;
}
