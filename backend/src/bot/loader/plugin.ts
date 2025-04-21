import type { Command } from "../plugin/core/public/command.ts";
import type { ConfigCache } from "../plugin/core/public/config.ts";
import type { EventListener } from "../plugin/core/public/eventListener.ts";

export interface Plugin {
	id: string;
	config?: ConfigCache;
	commands?: Command[];
	listeners?: EventListener[];
	apply?(): Promise<void> | void;
}

export function definePlugin(plugin: Plugin): Plugin {
	return plugin;
}