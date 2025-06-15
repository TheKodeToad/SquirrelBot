import type { Contribution } from "#loader/extensionPoint.ts";

export interface Plugin {
	id: string;
	name: string;
	description?: string;
	contributions?: Contribution[];
}

export function definePlugin(plugin: Plugin): Plugin {
	return plugin;
}
