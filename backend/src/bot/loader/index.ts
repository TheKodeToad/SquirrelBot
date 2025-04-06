import { module_logger } from "../../common/logger/index.ts";
import { core_plugin } from "../plugin/core/index.ts";
import { moderation_plugin } from "../plugin/moderation/index.ts";
import { util_plugin } from "../plugin/util/index.ts";
import type { Plugin } from "./plugin.ts";

const logger = module_logger();

const plugins: Map<string, Plugin> = new Map;

export function register_plugin(plugin: Plugin): void {
	if (plugins.has(plugin.id))
		throw new Error(`Duplicate registration of plugin #${plugin.id}`);


	plugins.set(plugin.id, plugin);
	logger.debug(() => `Registered plugin #${plugin.id}`);
}

export function get_plugins(): IterableIterator<Plugin> {
	return plugins.values();
}

export function count_plugins(): number {
	return plugins.size;
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
	for (const plugin of plugins.values()) {
		logger.debug(() => `Applying plugin #${plugin.id}`);
		await plugin.apply?.();
	}
}
