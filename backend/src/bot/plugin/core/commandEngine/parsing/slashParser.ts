import type { CommandCacheEntry } from "#bot/plugin/core/commandEngine/commandCache.ts";
import { ArgsParseError, type ArgsParseResult } from "#bot/plugin/core/commandEngine/parsing/index.ts";
import { readDuration, readSnowflake } from "#bot/plugin/core/commandEngine/parsing/primitiveParser.ts";
import { StringReader } from "#bot/plugin/core/commandEngine/parsing/stringReader.ts";
import { SafeArgs } from "#bot/plugin/core/commandEngine/safeArgs.ts";
import { OptionType, type AnyArgsValueItem } from "#bot/plugin/core/public/command.ts";
import type { InteractionOptions } from "oceanic.js";

export function readSlashArgs(interactionOptions: InteractionOptions[], commandEntry: CommandCacheEntry): ArgsParseResult {
	const output = new SafeArgs(commandEntry.command.options ?? {});

	for (const interactionOption of interactionOptions) {
		if (!("value" in interactionOption))
			continue;

		if (!commandEntry.optionsByName.has(interactionOption.name))
			continue;

		const [key, option] = commandEntry.optionsByName.get(interactionOption.name)!;

		let value: AnyArgsValueItem | null = interactionOption.value;

		if (typeof interactionOption.value === "string") {
			if (option.type === OptionType.Snowflake)
				value = readValue(interactionOption.value, readSnowflake);
			else if (option.type === OptionType.Duration)
				value = readValue(interactionOption.value, readDuration);
		}

		if (value === null) {
			return {
				error: ArgsParseError.BadNamedValue,
				name: interactionOption.name
			};
		}

		if (option.array ?? false)
			output.pushTo(key, value);
		else
			output.set(key, value);
	}

	return {
		error: null,
		result: output.getFrozenResult(),
	};
}

export function readValue<T>(value: string, valueReader: (reader: StringReader) => T): T | null {
	const reader = new StringReader(value);

	reader.skipWhitespace();
	const result = valueReader(reader);
	reader.skipWhitespace();

	if (reader.canRead() || result === null)
		return null;

	return result;
}
