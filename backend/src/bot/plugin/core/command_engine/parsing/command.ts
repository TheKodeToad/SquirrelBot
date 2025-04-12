import { OptionType, type AnyArgsValue, type AnyArgsValueItem, type Option } from "../../public/command/index.ts";
import type { CommandCacheEntry } from "../command_cache.ts";
import { SafeArgs } from "../safe_args.ts";
import { read_boolean, read_channel, read_integer, read_number, read_role, read_snowflake, read_string, read_user } from "./primitives.ts";
import type { StringReader } from "./string_reader.ts";

export function read_command_name(reader: StringReader, prefix: string): string | null {
	if (!reader.skip_over(prefix))
		return null;

	reader.skip_whitespace();

	if (!reader.can_read())
		return null;

	return reader.read_word();
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

export function read_command_args(reader: StringReader, command_entry: CommandCacheEntry): ArgsResult {
	const output = new SafeArgs(command_entry.command.options ?? {});

	let positional_index = 0;

	reader.skip_whitespace();

	while (reader.can_read()) {
		const named_option_result = read_named_arg(reader, command_entry, output);

		if (typeof named_option_result !== "boolean")
			return named_option_result;

		if (named_option_result)
			continue;

		const found_by_position = command_entry.options_by_position[positional_index];

		if (found_by_position === undefined) {
			return {
				error: ArgsParseError.BAD_POSITIONAL_INDEX,
				index: positional_index,
			};
		}

		const [key, option] = found_by_position;

		const value = read_command_arg(reader, option, false);

		if (value === null) {
			return {
				error: ArgsParseError.BAD_POSITIONAL_VALUE,
				index: positional_index
			};
		}

		if (value instanceof Array)
			output.push_to(key, ...value);
		else
			output.set(key, value);

		++positional_index;
	}

	if (output.get_missing().size !== 0) {
		return {
			error: ArgsParseError.MISSING_OPTIONS,
			options: output.get_missing()
		};
	}

	return {
		error: null,
		result: output.get_frozen_result()
	};
}

function read_named_arg(reader: StringReader, command_entry: CommandCacheEntry, output: SafeArgs): ArgsResult | boolean {
	if (!reader.skip_over("-"))
		return false;

	reader.skip_over("-");

	if (!reader.can_read())
		return { error: ArgsParseError.BARE_NAMED_KEY };

	const option_name = reader.read_word();

	const found_by_name = command_entry.options_by_name.get(option_name);

	if (found_by_name !== undefined) {
		const [key, option] = found_by_name;

		reader.skip_whitespace();

		const value = read_command_arg(reader, option, true);

		if (value === null) {
			return {
				error: ArgsParseError.BAD_NAMED_VALUE,
				name: option_name
			};
		}

		// maybe best not to make this immutable? it causes typing issues
		if (value instanceof Array)
			output.push_to(key, ...value);
		else
			output.set(key, value);

		return true;
	}

	const found_by_negative_name = command_entry.options_by_negative_name.get(option_name);

	if (found_by_negative_name !== undefined) {
		const key = found_by_negative_name;
		output.set(key, false);
		return true;
	}

	return {
		error: ArgsParseError.BAD_NAMED_KEY,
		name: option_name
	};
}

// null explicitly indicates error
function read_command_arg(reader: StringReader, option: Option, propagate_array_error: boolean): AnyArgsValue | null {
	if (!(option.array ?? false)) {
		if (!reader.can_read())
			return null;

		const result = read_command_arg_value(reader, option.type, GREEDY_VALUE_TERMINATOR);
		reader.skip_whitespace();

		return result;
	}

	let result: AnyArgsValueItem[] = [];

	while (reader.can_read() && !reader.match(ARRAY_TERMINATOR)) {
		reader.mark();

		const item = read_command_arg_value(reader, option.type);

		if (item === null) {
			reader.reset();

			if (propagate_array_error)
				return null;
			else
				break; // just keep the array without item
		} else
			reader.unmark();

		result.push(item);

		reader.skip_whitespace();
	}

	return result;
}

function read_command_arg_value(reader: StringReader, type: OptionType, terminator?: RegExp): AnyArgsValueItem | null {
	switch (type) {
		case OptionType.BOOLEAN:
			return read_boolean(reader);

		case OptionType.FLAG:
			return true;

		case OptionType.INTEGER:
			return read_integer(reader);

		case OptionType.NUMBER:
			return read_number(reader);

		case OptionType.STRING:
			return read_string(reader, terminator);

		case OptionType.SNOWFLAKE:
			return read_snowflake(reader);

		case OptionType.USER:
			return read_user(reader);

		case OptionType.ROLE:
			return read_role(reader);

		case OptionType.CHANNEL:
			return read_channel(reader);
	}
}
