import { get_plugins } from "../../../loader/index.ts";
import type { Command } from "../public/command/index.ts";

const all: Command[] = [];
const lookup: Map<string, Command[]> = new Map;

export function get_commands(): Command[] {
	return all;
}

export function get_commands_by_name(name: string): Command[] {
	return lookup.get(name) ?? [];
}

export function init_command_cache() {
	for (const plugin of get_plugins()) {
		if (plugin.commands === undefined)
			continue;

		for (const command of plugin.commands) {
			for (const name of command.name)
				put_command(name, command);

			all.push(command);
		}
	}
}

function put_command(key: string, value: Command) {
	let array = lookup.get(key);

	if (array === undefined) {
		array = [];
		lookup.set(key, array);
	}

	array.push(value);
}
