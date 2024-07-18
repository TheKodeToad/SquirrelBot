import { ConfigCache } from "../config";
import { Command } from "./command";
import { EventListener } from "./event_listener";

export interface Plugin {
	id: string;
	config?: ConfigCache;
	commands?: Command[];
	listeners?: EventListener[];
	apply?(): Promise<void> | void;
}

export function define_plugin(plugin: Plugin): Plugin {
	return plugin;
}