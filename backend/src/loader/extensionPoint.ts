import type { Plugin } from "#loader/plugin.ts";

export type Contribution = (plugin: Plugin) => void;

/**
 * Create an extension point collecting values into an array.
 *
 * @returns Basic extension point which stores passed values in contributedValues and ignores the plugin
 */
export function makeArrayExtensionPoint<T>(): ((value: T) => Contribution) & { contributions: T[]; } {
	const contributions: T[] = [];

	return Object.assign(
		function (value: T) {
			return (_: Plugin) => contributions.push(value);
		},
		{ contributions }
	);
}

/**
 * Create an extension point collecting values into a Map.
 *
 * @param name Name of exported symbol for debugging (e.g. contributeThing -> "Multiple usages of contributeThing for plugin #starboard")
 * @returns Map-backed extension point which stores a single value for each plugin or throws
 */
export function makeMapExtensionPoint<T>(name: string): ((value: T) => Contribution) & { contributions: Map<Plugin, T>; } {
	const contributions: Map<Plugin, T> = new Map;

	return Object.assign(
		function (value: T) {
			return (plugin: Plugin) => {
				if (contributions.has(plugin))
					throw new Error(`Multiple usages of ${name} for plugin #${plugin.id}`);

				contributions.set(plugin, value);
			};
		},
		{ contributions }
	);
}

export function makeMultiMapExtensionPoint<T>(): ((value: T) => Contribution) & { contributions: Map<Plugin, T[]>; } {
	const contributions: Map<Plugin, T[]> = new Map;

	return Object.assign(
		function (value: T) {
			return (plugin: Plugin) => {
				if (contributions.has(plugin))
					contributions.get(plugin)!.push(value);
				else
					contributions.set(plugin, [value]);
			};
		},
		{ contributions }
	);
}

export const enum EventListenerPhase {
	Default,
	Pre,
	Post,
}

type EventListener<T> = (event: T) => Promise<void> | void;

export function makeEventExtensionPoint<T>(): ((listener: EventListener<T>, phase?: EventListenerPhase) => Contribution) & { fire(event: T): Promise<void>; } {
	const contributions: Map<EventListenerPhase, EventListener<T>[]> = new Map;
	const firePhase = async (event: T, phase: EventListenerPhase): Promise<void> => {
		const listeners = contributions.get(phase);

		if (listeners === undefined)
			return;

		await Promise.all(listeners.map(listener => listener(event)));
	};

	return Object.assign(
		function (listener: (event: T) => void, phase = EventListenerPhase.Default) {
			return (_: Plugin) => {
				if (contributions.has(phase))
					contributions.get(phase)!.push(listener);
				else
					contributions.set(phase, [listener]);
			};
		},
		{
			async fire(event: T) {
				await firePhase(event, EventListenerPhase.Pre);
				await firePhase(event, EventListenerPhase.Default);
				await firePhase(event, EventListenerPhase.Post);
			}
		}
	);
}
