import { Client, GuildChannel } from "discord.js";
import { Command, EVENT_TO_GUILD, Plugin } from "./types";
import { ALLOWED_GUILDS } from "../config";

const plugins: Plugin[] = [];
const command_lookup: Map<string, Command[]> = new Map;
const all_commands: Command[] = [];

export function register_plugin(plugin: Plugin): void {
	plugins.push(plugin);

	if (plugin.commands) {
		for (const command of plugin.commands) {
			if (typeof command.id === "string")
				add_command(command.id, command);
			else
				command.id.forEach(id => add_command(id, command));

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

export async function apply_plugins(client: Client<true>): Promise<void> {
	for (const plugin of get_plugins()) {
		if (!plugin.listeners)
			continue;

		for (const listener of plugin.listeners) {
			client.on(listener.type, (...args) => {
				let guild: string | null = null;
				if (listener.type in EVENT_TO_GUILD)
					guild ??= EVENT_TO_GUILD[listener.type](...args);

				if (guild !== null && !ALLOWED_GUILDS.has(guild))
					return;

				listener.listener(...args);
			});
		}

		if (plugin.apply)
			await plugin.apply(client);
	}
}
