import { bot } from "..";
import { wrap_listener } from "./event_wrapper";
import { install_prefix_engine } from "./prefix_engine";
import { install_slash_engine } from "./slash_engine";
import { Command } from "./types/command";
import { Plugin } from "./types/plugin";

const plugins: Plugin[] = [];
const command_lookup: Map<string, Command[]> = new Map;
const all_commands: Command[] = [];

export function register_plugin(plugin: Plugin): void {
	plugins.push(plugin);

	if (plugin.commands) {
		for (const command of plugin.commands) {
			if (Array.isArray(command.id)) {
				for (const id of command.id)
					add_command(id, command);
			} else
				add_command(command.id, command);

			all_commands.push(command);
		}
	}
}

export function get_plugins(): Plugin[] {
	return plugins;
}

export function get_commands(name: string): Command[] {
	return command_lookup.get(name) ?? [];
}

export function get_all_commands(): Command[] {
	return all_commands;
}

function add_command(id: string, command: Command): void {
	if (!command_lookup.has(id))
		command_lookup.set(id, []);

	const list = command_lookup.get(id)!;
	list.push(command);
}

export async function apply_plugins(): Promise<void> {
	for (const plugin of get_plugins()) {
		await plugin.apply?.();

		if (plugin.listeners !== undefined) {
			for (const listener of plugin.listeners)
				bot.on(listener.type, wrap_listener(listener.type, listener.listener));
		}
	}

	install_prefix_engine();
	await install_slash_engine();
}
