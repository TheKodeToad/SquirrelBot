import { OptionType, type AnyArgsValue, type AnyArgsValueItem, type Option } from "../../public/command.ts";
import type { CommandCacheEntry } from "../commandCache.ts";
import { SafeArgs } from "../safeArgs.ts";
import { ArgsParseError, type ArgsParseResult } from "./index.ts";
import { readBoolean, readChannel, readDuration, readInteger, readNumber, readRole, readSnowflake, readString, readUser } from "./primitiveParser.ts";
import type { StringReader } from "./stringReader.ts";

const LIMITED_WHITESPACE_EATER_PATTERN = /\s{0,3}/y;

export function readPrefixName(reader: StringReader, prefix: string): string | null {
	if (!reader.skipOver(prefix))
		return null;

	reader.skipOver(LIMITED_WHITESPACE_EATER_PATTERN);

	if (!reader.canRead())
		return null;

	return reader.readWord();
}

const GREEDY_VALUE_TERMINATOR = /\s+--?[\w\-]/g;
const ARRAY_TERMINATOR = /--?[\w\-]/y;

export function readPrefixArgs(reader: StringReader, commandEntry: CommandCacheEntry): ArgsParseResult {
	const output = new SafeArgs(commandEntry.command.options ?? {});

	let positionalIndex = 0;

	reader.skipWhitespace();

	while (reader.canRead()) {
		const namedOptionResult = readNamedArg(reader, commandEntry, output);

		if (typeof namedOptionResult !== "boolean")
			return namedOptionResult;

		if (namedOptionResult)
			continue;

		const foundByPosition = commandEntry.optionsByPosition[positionalIndex];

		if (foundByPosition === undefined) {
			return {
				error: ArgsParseError.BadPositionalIndex,
				index: positionalIndex,
			};
		}

		const [key, option] = foundByPosition;

		const value = readCommandArg(reader, option, false);

		if (value === null) {
			return {
				error: ArgsParseError.BadPoisitionValue,
				index: positionalIndex
			};
		}

		if (value instanceof Array)
			output.pushTo(key, ...value);
		else
			output.set(key, value);

		++positionalIndex;
	}

	if (output.getMissing().size !== 0) {
		return {
			error: ArgsParseError.MissingOptions,
			options: output.getMissing()
		};
	}

	return {
		error: null,
		result: output.getFrozenResult()
	};
}

function readNamedArg(reader: StringReader, commandEntry: CommandCacheEntry, output: SafeArgs): ArgsParseResult | boolean {
	if (!reader.skipOver("-"))
		return false;

	reader.skipOver("-");

	if (!reader.canRead())
		return { error: ArgsParseError.BareNamedKey };

	const optionName = reader.readWord();

	const foundByName = commandEntry.optionsByName.get(optionName);

	if (foundByName !== undefined) {
		const [key, option] = foundByName;

		reader.skipWhitespace();

		const value = readCommandArg(reader, option, true);

		if (value === null) {
			return {
				error: ArgsParseError.BadNamedValue,
				name: optionName
			};
		}

		// maybe best not to make this immutable? it causes typing issues
		if (value instanceof Array)
			output.pushTo(key, ...value);
		else
			output.set(key, value);

		return true;
	}

	const foundByNegativeName = commandEntry.optionsByNegativeName.get(optionName);

	if (foundByNegativeName !== undefined) {
		const key = foundByNegativeName;
		output.set(key, false);
		return true;
	}

	return {
		error: ArgsParseError.BadNamedKey,
		name: optionName
	};
}

// null explicitly indicates error
function readCommandArg(reader: StringReader, option: Option, propagateArrayError: boolean): AnyArgsValue | null {
	if (option.type === OptionType.Flag)
		return true;

	if (!(option.array ?? false)) {
		if (!reader.canRead())
			return null;

		const result = readCommandArgValue(reader, option.type, GREEDY_VALUE_TERMINATOR);
		reader.skipWhitespace();

		return result;
	}

	let result: AnyArgsValueItem[] = [];

	while (reader.canRead() && !reader.match(ARRAY_TERMINATOR)) {
		reader.mark();

		const item = readCommandArgValue(reader, option.type);

		if (item === null) {
			reader.reset();

			if (propagateArrayError)
				return null;
			else
				break; // just keep the array without item
		} else
			reader.unmark();

		result.push(item);

		reader.skipWhitespace();
	}

	return result;
}

function readCommandArgValue(reader: StringReader, type: Exclude<OptionType, OptionType.Flag>, terminator?: RegExp): AnyArgsValueItem | null {
	switch (type) {
		case OptionType.Boolean:
			return readBoolean(reader);

		case OptionType.Integer:
			return readInteger(reader);

		case OptionType.Number:
			return readNumber(reader);

		case OptionType.String:
			return readString(reader, terminator);

		case OptionType.Snowflake:
			return readSnowflake(reader);

		case OptionType.User:
			return readUser(reader);

		case OptionType.Role:
			return readRole(reader);

		case OptionType.Channel:
			return readChannel(reader);

		case OptionType.Duration:
			return readDuration(reader);
	}
}
