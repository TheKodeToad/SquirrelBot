import { moduleLogger } from "#common/logger/index.ts";
import type { Plugin } from "#loader/plugin.ts";
import { readdir } from "node:fs/promises";
import path from "node:path";

const logger = moduleLogger();

let plugins: Map<string, Plugin> | null = null;

export async function loadPlugins(): Promise<void> {
	if (plugins !== null)
		throw new Error("Plugins already loaded");

	plugins = new Map;

	const pluginDir = path.join(import.meta.dirname, "..", "plugin");
	const entries = await readdir(pluginDir, { withFileTypes: true });
	const loaded: Plugin[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory())
			continue;

		const index = path.join(entry.parentPath, entry.name, "index.ts");
		const { default: plugin } = await import(index) as { default: Plugin; };

		initPlugin(plugin);

		loaded.push(plugin);
	}

	if (loaded.length === 0)
		throw new Error("No plugins loaded - something must be wrong!");

	loaded.sort((a, b) => {
		if (a.id < b.id)
			return -1;

		if (a.id > b.id)
			return 1;

		return 0;
	});

	for (const plugin of loaded) {
		if (plugins.has(plugin.id))
			throw new Error(`Duplicate plugin #${plugin.id}`);

		plugins.set(plugin.id, plugin);
	}

	logger.info?.(
		`Plugins (${getPluginCount()}):`,
		[...getPluginIDs()].map(id => "- " + id).join("\n")
	);
}

function initPlugin(plugin: Plugin): void {
	if (plugin.contributions !== undefined)
		for (const contribution of plugin.contributions)
			contribution(plugin);
}

function pluginsMap(): Map<string, Plugin> {
	if (plugins === null)
		throw new Error("Plugins not loaded");

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
