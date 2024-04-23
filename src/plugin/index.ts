import { Client } from "oceanic.js";
import { Command } from "./command";
import { EventListener } from "./event_listener";

export interface Plugin {
	id: string;
	commands?: Command[];
	listeners?: EventListener[];
	apply?(client: Client): Promise<void> | void;
}

export function define_plugin(plugin: Plugin): Plugin {
	return plugin;
}
