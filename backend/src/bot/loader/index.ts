import type { Plugin } from "#bot/loader/plugin.ts";
import { corePlugin } from "#bot/plugin/core/index.ts";
import { logging as loggingPlugin } from "#bot/plugin/logging/index.ts";
import { moderationPlugin } from "#bot/plugin/moderation/index.ts";
import { remindersPlugin } from "#bot/plugin/reminders/index.ts";
import { utilPlugin } from "#bot/plugin/util/index.ts";
import { moduleLogger } from "#common/logger/index.ts";

const logger = moduleLogger();

const plugins: Map<string, Plugin> = new Map;

export function registerPlugin(plugin: Plugin): void {
	if (plugins.has(plugin.id))
		throw new Error(`Duplicate registration of plugin #${plugin.id}`);

	plugins.set(plugin.id, plugin);
	logger.debug?.(`Registered plugin #${plugin.id}`);
}

export function getPlugins(): IterableIterator<Plugin> {
	return plugins.values();
}

export function countPlugins(): number {
	return plugins.size;
}

export function getPlugin(id: string): Plugin | undefined {
	return plugins.get(id);
}

export function loadPlugins(): void {
	// only support first-party plugins for now :)
	registerPlugin(corePlugin);
	registerPlugin(moderationPlugin);
	registerPlugin(loggingPlugin);
	registerPlugin(remindersPlugin);
	registerPlugin(utilPlugin);
}

export async function applyPlugins(): Promise<void> {
	for (const plugin of plugins.values()) {
		logger.debug?.(`Applying plugin #${plugin.id}`);
		await plugin.apply?.();
	}
}
