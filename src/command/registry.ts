import { Command, Flag, FlagType } from "./types";

const list: Command[] = [];
const lookup = new Map<string, Command[]>();

function put(id: string, command: Command) {
	if (!lookup.has(id))
		lookup.set(id, []);

	const list = lookup.get(id);
	list.push(command);
}

export function register_command<Flags extends Record<string, Flag>>(command: Command<Flags>) {
	if (typeof command.id === "string")
		put(command.id, command);
	else
		command.id.forEach(id => put(id, command));

	list.push(command);
}

export function get_all_commands(): Command[] {
	return list;
}

export function get_commands(name: string): Command[] | null {
	return lookup.get(name) ?? [];
}
