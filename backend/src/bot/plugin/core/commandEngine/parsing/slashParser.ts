import type { InteractionOptions } from "oceanic.js";
import { OptionType, type AnyArgsValueItem } from "../../public/command/index.ts";
import type { CommandCacheEntry } from "../commandCache.ts";
import { SafeArgs } from "../safeArgs.ts";
import { ArgsParseError, type ArgsParseResult } from "./index.ts";
import { readSnowflake } from "./primitiveParser.ts";
import { StringReader } from "./stringReader.ts";

export function readSlashArgs(interactionOptions: InteractionOptions[], commandEntry: CommandCacheEntry): ArgsParseResult {
	const output = new SafeArgs(commandEntry.command.options ?? {});

	for (const interactionOption of interactionOptions) {
		if (!("value" in interactionOption))
			continue;

		if (!commandEntry.optionsByName.has(interactionOption.name))
			continue;

		const [key, option] = commandEntry.optionsByName.get(interactionOption.name)!;

		let value: AnyArgsValueItem;

		switch (option.type) {
			case OptionType.SNOWFLAKE:
				if (typeof interactionOption.value !== "string")
					continue;

				const reader = new StringReader(interactionOption.value);

				reader.skipWhitespace();
				const snowflake = readSnowflake(reader);
				reader.skipWhitespace();

				if (reader.canRead() || snowflake === null) {
					return {
						error: ArgsParseError.BAD_NAMED_VALUE,
						name: interactionOption.name
					};
				}

				value = snowflake;
				break;
			default:
				value = interactionOption.value;
				break;
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
