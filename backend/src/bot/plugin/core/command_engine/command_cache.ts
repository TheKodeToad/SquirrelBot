import { getPlugins } from "../../../loader/index.ts";
import type { Command, Option } from "../public/command/index.ts";

export interface CommandCacheEntry {
	command: Command;
	optionsByPosition: [string, Option][];
	optionsByName: Map<string, [string, Option]>;
	optionsByNegativeName: Map<string, string>;
}

const all: CommandCacheEntry[] = [];
const lookup: Map<string, CommandCacheEntry[]> = new Map;

export function getCommands(): CommandCacheEntry[] {
	return all;
}

export function getCommandsByName(name: string): CommandCacheEntry[] {
	return lookup.get(name) ?? [];
}

export function initCommandCache() {
	for (const plugin of getPlugins()) {
		if (plugin.commands === undefined)
			continue;

		for (const command of plugin.commands) {
			const entry = makeCacheEntry(command);

			for (const name of command.name) {
				let array = lookup.get(name);

				if (array === undefined) {
					array = [];
					lookup.set(name, array);
				}

				array.push(entry);
			}

			all.push(entry);
		}
	}
}

// TODO: remove this!
export function makeCacheEntry(command: Command): CommandCacheEntry {
	const optionsByPosition: [string, Option][] = [];
	const optionsByName: Map<string, [string, Option]> = new Map;
	const optionsByNegativeName: Map<string, string> = new Map;

	for (const key in command.options) {
		if (!Object.hasOwn(command.options, key))
			continue;

		const option = command.options[key]!;

		if (typeof option.position === "number")
			optionsByPosition[option.position] = [key, option];

		for (const name of option.name)
			optionsByName.set(name, [key, option]);

		if ("negativeName" in option && option.negativeName !== undefined)
			for (const negativeName of option.negativeName)
				optionsByNegativeName.set(negativeName, key);
	}

	return {
		command,
		optionsByPosition,
		optionsByName,
		optionsByNegativeName,
	};
}


