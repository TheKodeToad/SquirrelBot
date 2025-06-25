import type { Plugin } from "#loader/plugin.ts";

/**
 * An ExtensionPoint is simply a function which takes a single argument and returns a Contribution.
 * It is not explicitly specified everywhere.
 */
export type ExtensionPoint<TValue> = (value: TValue) => Contribution;
export type Contribution = (plugin: Plugin) => void;

/**
 * Create an extension point collecting values into an array.
 *
 * @returns Basic extension point which stores passed values in contributedValues and ignores the plugin
 */
export function makeArrayExtensionPoint<T>(): ExtensionPoint<T> & { contributions: T[]; } {
	const contributions: T[] = [];

	return Object.assign(
		(value: T) => (_: Plugin) => contributions.push(value),
		{ contributions }
	);
}

/**
 * Create an extension point collecting values into a Map.
 *
 * @param name Name of exported symbol for debugging (e.g. contributeThing -> "Multiple usages of contributeThing for plugin #starboard")
 * @returns Map-backed extension point which stores a single value for each plugin or throws
 */
export function makeMapExtensionPoint<T>(name: string): ExtensionPoint<T> & { contributions: Map<Plugin, T>; } {
	const contributions: Map<Plugin, T> = new Map;

	return Object.assign(
		(value: T) => (plugin: Plugin) => {
			if (contributions.has(plugin))
				throw new Error(`Multiple usages of ${name} for plugin #${plugin.id}`);

			contributions.set(plugin, value);
		},
		{ contributions }
	);
}

export function makeMultiMapExtensionPoint<T>(): ExtensionPoint<T> & { contributions: Map<Plugin, T[]>; } {
	const contributions: Map<Plugin, T[]> = new Map;

	return Object.assign(
		(value: T) => (plugin: Plugin) => {
			if (contributions.has(plugin))
				contributions.get(plugin)!.push(value);
			else
				contributions.set(plugin, [value]);
		},
		{ contributions }
	);
}
