import type { Plugin } from "#loader/plugin.ts";

export type ExtensionPoint<TValue, TContributions> = ((value: TValue) => Contribution) & { contributions: TContributions; };
export type Contribution = (plugin: Plugin) => void;

/**
 * Create an extension point collecting values into an array.
 *
 * @returns Basic extension point which stores passed values in contributedValues and ignores the plugin
 */
export function makeArrayExtensionPoint<T>(): ExtensionPoint<T, T[]> {
	const sink: T[] = [];

	return Object.assign(
		(value: T) => (_: Plugin) => sink.push(value),
		{ contributions: sink }
	);
}

/**
 * Create an extension point collecting values into a Map.
 *
 * @param name Name of exported symbol for debugging (e.g. contributeThing -> "Multiple usages of contributeThing for plugin #starboard")
 * @returns Map-backed extension point which stores a single value for each plugin or throws
 */
export function makeMapExtensionPoint<T>(name: string): ExtensionPoint<T, Map<Plugin, T>> {
	const sink: Map<Plugin, T> = new Map;

	return Object.assign(
		(value: T) => (plugin: Plugin) => {
			if (sink.has(plugin))
				throw new Error(`Multiple usages of ${name} for plugin #${plugin.id}`);

			sink.set(plugin, value);
		},
		{ contributions: sink }
	);
}
