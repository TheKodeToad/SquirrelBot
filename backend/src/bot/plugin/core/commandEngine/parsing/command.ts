import { OptionType, type AnyArgsValue, type AnyArgsValueItem, type Option } from "../../public/command/index.ts";
import type { CommandCacheEntry } from "../commandCache.ts";
import { SafeArgs } from "../safeArgs.ts";
import { readBoolean, readChannel, readInteger, readNumber, readRole, readSnowflake, readString, readUser } from "./primitives.ts";
import type { StringReader } from "./stringReader.ts";

export function readCommandName(reader: StringReader, prefix: string): string | null {
	if (!reader.skipOver(prefix))
		return null;

	reader.skipWhitespace();

	if (!reader.canRead())
		return null;

	return reader.readWord();
}

export const enum ArgsParseError {
	MISSING_OPTIONS,
	BAD_NAMED_KEY,
	BAD_NAMED_VALUE,
	BARE_NAMED_KEY,
	BAD_POSITIONAL_INDEX,
	BAD_POSITIONAL_VALUE,
}

export type ArgsResult =
	| { error: null; result: Record<string, AnyArgsValue>; }
	| { error: ArgsParseError.MISSING_OPTIONS, options: Set<string>; }
	| { error: ArgsParseError.BAD_NAMED_KEY | ArgsParseError.BAD_NAMED_VALUE; name: string; }
	| { error: ArgsParseError.BARE_NAMED_KEY; }
	| { error: ArgsParseError.BAD_POSITIONAL_INDEX | ArgsParseError.BAD_POSITIONAL_VALUE, index: number; };

const GREEDY_VALUE_TERMINATOR = /\s+--?[\w\-]/g;
const ARRAY_TERMINATOR = /--?[\w\-]/y;

export function readCommandArgs(reader: StringReader, commandEntry: CommandCacheEntry): ArgsResult {
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
				error: ArgsParseError.BAD_POSITIONAL_INDEX,
				index: positionalIndex,
			};
		}

		const [key, option] = foundByPosition;

		const value = readCommandArg(reader, option, false);

		if (value === null) {
			return {
				error: ArgsParseError.BAD_POSITIONAL_VALUE,
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
			error: ArgsParseError.MISSING_OPTIONS,
			options: output.getMissing()
		};
	}

	return {
		error: null,
		result: output.getFrozenResult()
	};
}

function readNamedArg(reader: StringReader, commandEntry: CommandCacheEntry, output: SafeArgs): ArgsResult | boolean {
	if (!reader.skipOver("-"))
		return false;

	reader.skipOver("-");

	if (!reader.canRead())
		return { error: ArgsParseError.BARE_NAMED_KEY };

	const optionName = reader.readWord();

	const foundByName = commandEntry.optionsByName.get(optionName);

	if (foundByName !== undefined) {
		const [key, option] = foundByName;

		reader.skipWhitespace();

		const value = readCommandArg(reader, option, true);

		if (value === null) {
			return {
				error: ArgsParseError.BAD_NAMED_VALUE,
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
		error: ArgsParseError.BAD_NAMED_KEY,
		name: optionName
	};
}

// null explicitly indicates error
function readCommandArg(reader: StringReader, option: Option, propagateArrayError: boolean): AnyArgsValue | null {
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

function readCommandArgValue(reader: StringReader, type: OptionType, terminator?: RegExp): AnyArgsValueItem | null {
	switch (type) {
		case OptionType.BOOLEAN:
			return readBoolean(reader);

		case OptionType.FLAG:
			return true;

		case OptionType.INTEGER:
			return readInteger(reader);

		case OptionType.NUMBER:
			return readNumber(reader);

		case OptionType.STRING:
			return readString(reader, terminator);

		case OptionType.SNOWFLAKE:
			return readSnowflake(reader);

		case OptionType.USER:
			return readUser(reader);

		case OptionType.ROLE:
			return readRole(reader);

		case OptionType.CHANNEL:
			return readChannel(reader);
	}
}
