import type { Command } from "./types/command.ts";
import type { Plugin } from "./types/plugin.ts";

const plugins: Map<string, Plugin> = new Map;
const commands: Map<string, Command[]> = new Map;
const unique_commands: Command[] = [];

export function register_plugin(plugin: Plugin): void {
	if (plugins.has(plugin.id))
		throw new Error(`Duplicate registration of plugin #'${plugin.id}'`);

	plugins.set(plugin.id, plugin);

	if (plugin.commands) {
		for (const command of plugin.commands) {
			if (Array.isArray(command.id)) {
				for (const id of command.id)
					add_command(id, command);
			} else
				add_command(command.id, command);

			unique_commands.push(command);
		}
	}
}

export function get_plugins(): IterableIterator<Plugin> {
	return plugins.values();
}

export function get_plugin(id: string): Plugin | undefined {
	return plugins.get(id);
}

export function get_commands(): Command[] {
	return unique_commands;
}

export function get_commands_named(name: string): Command[] {
	return commands.get(name) ?? [];
}

function add_command(id: string, command: Command): void {
	let list = commands.get(id);

	if (list === undefined) {
		list = [];
		commands.set(id, list);
	}

	list.push(command);
}

export async function apply_plugins(): Promise<void> {
	for (const plugin of plugins.values())
		await plugin.apply?.();
}
