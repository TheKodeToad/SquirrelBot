import type { StringReader } from "#common/stringReader.ts";
import {
	ArgsParseError,
	type ArgsParseResult,
} from "#plugin/core/commandEngine/parsing/index.ts";
import {
	readChannel,
	readInteger,
	readNumber,
	readRole,
	readString,
	readUser,
} from "#plugin/core/commandEngine/parsing/primitiveParsers.ts";
import { SafeArgs } from "#plugin/core/commandEngine/safeArgs.ts";
import { type Option } from "#plugin/core/public/command.ts";
import type { CommandCacheEntry } from "../commandCache.ts";

const LIMITED_WHITESPACE_EATER_PATTERN = /\s{0,3}/y;

export function readPrefixName(
	reader: StringReader,
	prefix: string,
): string | null {
	if (!reader.skipOver(prefix)) {
		return null;
	}

	reader.skipOver(LIMITED_WHITESPACE_EATER_PATTERN);

	if (!reader.canRead()) {
		return null;
	}

	return reader.readWord().toLowerCase();
}

const GREEDY_VALUE_TERMINATOR = /\s+--?[\w-]/g;
const ARRAY_TERMINATOR = /--?[\w-]/y;

export function readPrefixArgs(
	reader: StringReader,
	commandEntry: CommandCacheEntry,
): ArgsParseResult {
	const output = new SafeArgs(commandEntry.command.options ?? {});

	let positionalIndex = 0;

	reader.skipWhitespace();

	while (reader.canRead()) {
		const namedOptionResult = readNamedArg(reader, commandEntry, output);

		if (typeof namedOptionResult !== "boolean") {
			return namedOptionResult;
		}

		if (namedOptionResult) {
			continue;
		}

		const foundByPosition = commandEntry.optionsByPosition[positionalIndex];

		if (foundByPosition === undefined) {
			return {
				error: ArgsParseError.BadPositionalIndex,
				index: positionalIndex,
			};
		}

		const [key, option] = foundByPosition;

		const prevCursor = reader.cursor;
		const value = readCommandArg(reader, option, false);

		if (value === null) {
			if (option.skipIfInvalid) {
				reader.cursor = prevCursor;
				++positionalIndex;
				continue;
			}

			return {
				error: ArgsParseError.BadPoisitionalValue,
				index: positionalIndex,
				name: option.name[0],
			};
		}

		if (Array.isArray(value)) {
			output.pushTo(key, ...(value as unknown[]));
		} else {
			output.set(key, value);
		}

		++positionalIndex;
	}

	if (output.getMissing().size !== 0) {
		return {
			error: ArgsParseError.MissingOptions,
			options: output.getMissing(),
		};
	}

	return {
		error: null,
		result: output.getFrozenResult(),
	};
}

function readNamedArg(
	reader: StringReader,
	commandEntry: CommandCacheEntry,
	output: SafeArgs,
): ArgsParseResult | boolean {
	if (!reader.skipOver("-")) {
		return false;
	}

	reader.skipOver("-");

	if (!reader.canRead()) {
		return { error: ArgsParseError.BareNamedKey };
	}

	const optionName = reader.readWord().toLowerCase();

	if (optionName.length === 0) {
		return { error: ArgsParseError.BareNamedKey };
	}

	const foundByName = commandEntry.optionsByName.get(optionName);

	if (foundByName !== undefined) {
		const [key, option] = foundByName;

		reader.skipWhitespace();

		const value = readCommandArg(reader, option, true);

		if (value === null) {
			return {
				error: ArgsParseError.BadNamedValue,
				name: optionName,
			};
		}

		// maybe best not to make this immutable? it causes typing issues
		if (value instanceof Array) {
			output.pushTo(key, ...(value as unknown[]));
		} else {
			output.set(key, value);
		}

		return true;
	}

	const foundByNegativeName =
		commandEntry.optionsByNegativeName.get(optionName);

	if (foundByNegativeName !== undefined) {
		const key = foundByNegativeName;
		output.set(key, false);
		return true;
	}

	return {
		error: ArgsParseError.BadNamedKey,
		name: optionName,
	};
}

// null explicitly indicates error
function readCommandArg(
	reader: StringReader,
	option: Option,
	propagateArrayError: boolean,
): {} | null {
	if (option.type === "boolean") {
		return true;
	}

	if (!(option.array ?? false)) {
		if (!reader.canRead()) {
			return null;
		}

		const result = readCommandArgValue(reader, option);
		reader.skipWhitespace();

		return result;
	}

	const result: unknown[] = [];

	while (reader.canRead() && !reader.match(ARRAY_TERMINATOR)) {
		const prevCursor = reader.cursor;

		const item = readCommandArgValue(reader, option);

		if (item === null) {
			reader.cursor = prevCursor;

			if (propagateArrayError) {
				return null;
			} else {
				break; // just keep the array without item
			}
		}

		result.push(item);

		reader.skipWhitespace();
	}

	return result;
}

function readCommandArgValue(reader: StringReader, option: Option): {} | null {
	switch (option.type) {
		case "boolean":
			return true;
		case "integer":
			return readInteger(reader);
		case "number":
			return readNumber(reader);
		case "string": {
			const terminator =
				(option.greedy ?? true) ? GREEDY_VALUE_TERMINATOR : undefined;
			const result = readString(reader, terminator);

			if (result === null || result.length === 0) {
				return null;
			}

			if (
				option.minLength !== undefined &&
				result.length < option.minLength
			) {
				return null;
			}

			if (
				option.maxLength !== undefined &&
				result.length > option.maxLength
			) {
				return null;
			}

			return result;
		}
		case "user":
			return readUser(reader);
		case "role":
			return readRole(reader);
		case "channel":
			return readChannel(reader);
		default:
			return option.type.read(reader);
	}
}
