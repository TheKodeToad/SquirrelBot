import { onBotInit } from "#discord/extensionPoints.ts";
import { EventListenerPhase } from "#loader/extensionPoint.ts";
import { OptionType, type Command, type Option } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";

export interface CommandCacheEntry {
	command: Command;
	optionsByPosition: [string, Option][];
	optionsByName: Map<string, [string, Option]>;
	optionsByNegativeName: Map<string, string>;
	usage: string;
}

const all: CommandCacheEntry[] = [];
const byName: Map<string, CommandCacheEntry> = new Map;
const byPlugin: Map<string, CommandCacheEntry[]> = new Map;

export default [onBotInit(initCommandCache, EventListenerPhase.Pre)];

export function getCommands(): CommandCacheEntry[] {
	return all;
}

export function getCommandByName(name: string): CommandCacheEntry | undefined {
	return byName.get(name);
}

export function getCommandsByPlugin(name: string): CommandCacheEntry[] | undefined {
	return byPlugin.get(name);
}

function initCommandCache(): void {
	for (const [plugin, command] of defineCommand.contributions) {
		const entry = makeCacheEntry(command);

		for (const name of command.name) {
			const nameLower = name.toLowerCase();

			if (byName.has(nameLower))
				throw new Error(`Conflicting commands with name ${name}!`);

			byName.set(name.toLowerCase(), entry);
		}

		let pluginCommands = byPlugin.get(plugin.name);

		if (pluginCommands === undefined) {
			pluginCommands = [];
			byPlugin.set(plugin.name, pluginCommands);
		}

		pluginCommands.push(entry);

		all.push(entry);
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
			optionsByName.set(name.toLowerCase(), [key, option]);

		if ("negativeName" in option && option.negativeName !== undefined)
			for (const negativeName of option.negativeName)
				optionsByNegativeName.set(negativeName.toLowerCase(), key);
	}

	return {
		command,
		optionsByPosition,
		optionsByName,
		optionsByNegativeName,
		usage: formatCommandPrefixUsage(command.options, optionsByPosition),
	};
}


function formatCommandPrefixUsage(options: Command["options"], optionsByPosition: CommandCacheEntry["optionsByPosition"]): string {
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

function formatOptionValue(option: Option): string {
	switch (option.type) {
	case OptionType.Boolean:
		return option.array ? "boolean(s)" : "(true|false)";
	case OptionType.Flag:
		return "";
	case OptionType.Integer:
		return option.array ? "integer(s)" : "integer";
	case OptionType.Number:
		return option.array ? "number(s)" : "number";
	case OptionType.String:
		return option.array ? "text(s)" : "text";
	case OptionType.Snowflake:
		return option.array ? "id(s)" : "id";
	case OptionType.User:
		return option.array ? "user(s)" : "user";
	case OptionType.Role:
		return option.array ? "role(s)" : "role";
	case OptionType.Channel:
		return option.array ? "channel(s)" : "channel";
	case OptionType.Duration:
		return option.array ? "duration(s)" : "duration";
	}
}


