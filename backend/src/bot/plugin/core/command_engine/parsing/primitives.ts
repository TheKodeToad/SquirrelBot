import { is_snowflake } from "../../../../../common/snowflake.ts";
import type { StringReader } from "./string_reader.ts";

export function read_boolean(reader: StringReader) {
	const result = reader.read_word();

	if (result === "false" || result === "f" || result === "0")
		return false;
	else if (result === "true" || result === "t" || result === "1")
		return true;

	return null;
}

export function read_integer(reader: StringReader) {
	const result = parseInt(reader.read_word());

	if (!Number.isInteger(result))
		return null;

	return result;
}

export function read_number(reader: StringReader): number | null {
	const result = parseFloat(reader.read_word());

	if (!Number.isFinite(result))
		return null;

	return result;
}

/**
 * Read a quoted or unquoted string.
 * @param reader StringReader instance
 * @param terminator The pattern to terminate the string if unquoted - defaults to space
 */
export function read_string(reader: StringReader, terminator?: RegExp) {
	if (!(reader.peek() === "'" || reader.peek() === '"') || reader.peek() === "`") {
		if (terminator !== undefined)
			return reader.read_until(terminator);
		else
			return reader.read_word();
	}

	// potentially slow :(
	// substring is likely to be highly optimised
	// probably doesn't matter though - this just seems like it could be a lukewarm path

	let result = "";

	const end_quote = reader.read();
	const escaped_quote = end_quote + end_quote;

	while (reader.read() !== end_quote) {
		if (!reader.can_read())
			return null;

		result += reader.peek(0);

		if (reader.skip_over(escaped_quote))
			result += end_quote;
	}

	return result;
}

export function read_snowflake(reader: StringReader): string | null {
	const id = reader.read_word();

	if (!is_snowflake(id))
		return null;

	return id;
}

export function read_user(reader: StringReader): string | null {
	return read_mention(reader, "@");
}

export function read_role(reader: StringReader): string | null {
	return read_mention(reader, "&");
}

export function read_channel(reader: StringReader): string | null {
	return read_mention(reader, "#");
}

function read_mention(reader: StringReader, prefix: "@" | "&" | "#"): string | null {
	if (!reader.skip_over("<" + prefix))
		return read_snowflake(reader);

	if (prefix === "@")
		reader.skip_over("!");

	const id = reader.read_until(">");
	reader.read(); // skip trailing >

	if (!is_snowflake(id))
		return null;

	return id;
}
