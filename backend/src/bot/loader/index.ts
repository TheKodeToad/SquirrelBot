import { core_plugin } from "../plugin/core/index.ts";
import { moderation_plugin } from "../plugin/moderation/index.ts";
import { util_plugin } from "../plugin/util/index.ts";
import type { Plugin } from "./plugin.ts";

const plugins: Map<string, Plugin> = new Map;

export function register_plugin(plugin: Plugin): void {
	if (plugins.has(plugin.id))
		throw new Error(`Duplicate registration of plugin #'${plugin.id}'`);

	plugins.set(plugin.id, plugin);
}

export function get_plugins(): IterableIterator<Plugin> {
	return plugins.values();
}

export function get_plugin(id: string): Plugin | undefined {
	return plugins.get(id);
}

export function load_plugins() {
	// only support first-party plugins for now :)
	register_plugin(core_plugin);
	register_plugin(moderation_plugin);
	register_plugin(util_plugin);
}

export async function apply_plugins(): Promise<void> {
	for (const plugin of plugins.values())
		await plugin.apply?.();
}
