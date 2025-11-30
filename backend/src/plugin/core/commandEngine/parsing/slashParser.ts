import { StringReader } from "#common/stringReader.ts";
import type { CommandCacheEntry } from "#plugin/core/commandEngine/commandCache.ts";
import {
	ArgsParseError,
	type ArgsParseResult,
} from "#plugin/core/commandEngine/parsing/index.ts";
import { SafeArgs } from "#plugin/core/commandEngine/safeArgs.ts";
import type { InteractionOptions } from "oceanic.js";

export function readSlashArgs(
	interactionOptions: InteractionOptions[],
	commandEntry: CommandCacheEntry,
): ArgsParseResult {
	const output = new SafeArgs(commandEntry.command.options ?? {});

	for (const interactionOption of interactionOptions) {
		if (!("value" in interactionOption)) {
			continue;
		}

		if (!commandEntry.optionsByName.has(interactionOption.name)) {
			continue;
		}

		const [key, option] = commandEntry.optionsByName.get(
			interactionOption.name,
		)!;

		let value: {} | null = interactionOption.value;

		if (typeof option.type === "object" && typeof value === "string") {
			const reader = new StringReader(value);

			reader.skipWhitespace();
			value = option.type.read(reader);
			reader.skipWhitespace();

			if (reader.canRead()) {
				value = null;
			}
		} else if (option.type === "boolean" && typeof value === "number") {
			value = interactionOption.value !== 0;
		}

		if (value === null) {
			return {
				error: ArgsParseError.BadNamedValue,
				name: interactionOption.name,
			};
		}

		if (option.array ?? false) {
			output.pushTo(key, value);
		} else {
			output.set(key, value);
		}
	}

	return {
		error: null,
		result: output.getFrozenResult(),
	};
}
