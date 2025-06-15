import type { Plugin } from "#plugin/index.ts";
import { readdir } from "node:fs/promises";
import path from "node:path";

let plugins: Map<string, Plugin> | null = null;

export async function importPlugins(): Promise<void> {
	if (plugins !== null)
		throw new Error("Plugins already imported");

	plugins = new Map;

	const entries = await readdir(import.meta.dirname, { withFileTypes: true });

	entries.sort((a, b) => {
		if (a.name < b.name)
			return -1;

		if (a.name > b.name)
			return 1;

		return 0;
	});

	for (const entry of entries) {
		if (!entry.isDirectory())
			continue;

		const index = path.join(entry.parentPath, entry.name, "index.ts");
		const { default: plugin } = await import(index) as { default: Plugin; };

		plugins.set(plugin.id, plugin);
	}
}

function pluginsMap(): Map<string, Plugin> {
	if (plugins === null)
		throw new Error("importPlugins not called");

	return plugins;
}

export function getPlugins(): MapIterator<Plugin> {
	return pluginsMap().values();
}

export function getPluginCount(): number {
	return pluginsMap().size;
}

export function getPlugin(id: string): Plugin | undefined {
	return pluginsMap().get(id);
}

export function getPluginIDs(): MapIterator<string> {
	return pluginsMap().keys();
}
