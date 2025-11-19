export interface Plugin {
	id: string;
	name: string;
	description?: string;
	contributions?: Contribution[];
}

export type Contribution = (plugin: Plugin) => void;

export function definePlugin(plugin: Plugin): Plugin {
	return plugin;
}
