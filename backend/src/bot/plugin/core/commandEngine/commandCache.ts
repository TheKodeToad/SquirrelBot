import { getPlugins } from "../../../loader/index.ts";
import { OptionType, type Command, type Option } from "../public/command.ts";

export interface CommandCacheEntry {
	command: Command;
	optionsByPosition: [string, Option][];
	optionsByName: Map<string, [string, Option]>;
	optionsByNegativeName: Map<string, string>;
	usage: string;
}

const all: CommandCacheEntry[] = [];
const lookup: Map<string, CommandCacheEntry[]> = new Map;

export function getCommands(): CommandCacheEntry[] {
	return all;
}

// TODO: only have one command per name
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

function makeCacheEntry(command: Command): CommandCacheEntry {
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

	const usage = formatCommandUsage(command.options, optionsByPosition);

	return {
		command,
		optionsByPosition,
		optionsByName,
		optionsByNegativeName,
		usage,
	};
}


function formatCommandUsage(options: Command["options"], optionsByPosition: CommandCacheEntry["optionsByPosition"]): string {
	let result = "";

	const alreadyDisplayed = new Set;

	for (const [key, option] of optionsByPosition) {
		result += " ";

		if (!option.required)
			result += "[";

		result += "<" + option.name[0] + ">";

		if (!option.required)
			result += "]";

		alreadyDisplayed.add(key);
	}

	for (const key in options) {
		if (!Object.hasOwn(options, key))
			continue;

		if (alreadyDisplayed.has(key))
			continue;

		const option = options[key]!;

		result += " ";

		if (!option.required)
			result += "[";

		if ("negativeName" in option && option.negativeName !== undefined)
			result += "(-" + option.name[0] + "|-" + option.negativeName[0] + ")";
		else
			result += "-" + option.name[0];

		if (option.type !== OptionType.Flag)
			result += " <" + formatOptionValue(option) + ">";

		if (!option.required)
			result += "]";
	}

	return result;
}

function formatOptionValue(option: Option) {
	switch (option.type) {
		case OptionType.Boolean: return option.array ? "boolean(s)" : "(true|false)";
		case OptionType.Flag: return "";
		case OptionType.Integer: return option.array ? "whole number(s)" : "whole number";
		case OptionType.Number: return option.array ? "number(s)" : "number";
		case OptionType.String: return option.array ? "text value(s)" : "text";
		case OptionType.Snowflake: return option.array ? "snowflake(s)" : "snowflake";
		case OptionType.User: return option.array ? "user(s)" : "user";
		case OptionType.Role: return option.array ? "role(s)" : "role";
		case OptionType.Channel: return option.array ? "channel(s)" : "channel";
		case OptionType.Duration: return option.array ? "duration(s)" : "duration";
	}

}


