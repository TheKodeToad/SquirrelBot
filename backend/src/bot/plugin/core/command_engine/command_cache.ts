import { get_plugins } from "../../../loader/index.ts";
import type { Command, Option } from "../public/command/index.ts";

export interface CommandCacheEntry {
	command: Command;
	options_by_position: [string, Option][];
	options_by_name: Map<string, [string, Option]>;
	options_by_negative_name: Map<string, string>;
}

const all: CommandCacheEntry[] = [];
const lookup: Map<string, CommandCacheEntry[]> = new Map;

export function get_commands(): CommandCacheEntry[] {
	return all;
}

export function get_commands_by_name(name: string): CommandCacheEntry[] {
	return lookup.get(name) ?? [];
}

export function init_command_cache() {
	for (const plugin of get_plugins()) {
		if (plugin.commands === undefined)
			continue;

		for (const command of plugin.commands) {
			const entry = make_cache_entry(command);

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
export function make_cache_entry(command: Command): CommandCacheEntry {
	const options_by_position: [string, Option][] = [];
	const options_by_name: Map<string, [string, Option]> = new Map;
	const options_by_negative_name: Map<string, string> = new Map;

	for (const key in command.options) {
		if (!Object.hasOwn(command.options, key))
			continue;

		const option = command.options[key]!;

		if (typeof option.position === "number")
			options_by_position[option.position] = [key, option];

		for (const name of option.name)
			options_by_name.set(name, [key, option]);

		if ("negative_name" in option && option.negative_name !== undefined)
			for (const negative_name of option.negative_name)
				options_by_negative_name.set(negative_name, key);
	}

	return {
		command,
		options_by_position: options_by_position,
		options_by_name: options_by_name,
		options_by_negative_name: options_by_negative_name,
	};
}


