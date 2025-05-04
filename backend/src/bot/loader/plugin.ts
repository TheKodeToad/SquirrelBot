import type { Command } from "../plugin/core/public/command.ts";
import type { ConfigStore } from "../plugin/core/public/config.ts";
import type { EventListener } from "../plugin/core/public/eventListener.ts";

export interface Plugin {
	id: string;
	name: string;
	description?: string;
	config?: PluginConfig;
	commands?: Command[];
	listeners?: EventListener[];
	apply?(): Promise<void> | void;
}

export interface PluginConfig {
	store: ConfigStore;
	defaultValue: string;
}

export function definePlugin(plugin: Plugin): Plugin {
	return plugin;
}
