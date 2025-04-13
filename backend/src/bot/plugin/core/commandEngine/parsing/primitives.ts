import { isSnowflake } from "../../../../../common/snowflake.ts";
import type { StringReader } from "./stringReader.ts";

export function readBoolean(reader: StringReader) {
	const result = reader.readWord();

	if (result === "false" || result === "f" || result === "0")
		return false;
	else if (result === "true" || result === "t" || result === "1")
		return true;

	return null;
}

export function readInteger(reader: StringReader) {
	const result = parseInt(reader.readWord());

	if (!Number.isInteger(result))
		return null;

	return result;
}

export function readNumber(reader: StringReader): number | null {
	const result = parseFloat(reader.readWord());

	if (!Number.isFinite(result))
		return null;

	return result;
}

/**
 * Read a quoted or unquoted string.
 * @param reader StringReader instance
 * @param terminator The pattern to terminate the string if unquoted - defaults to space
 */
export function readString(reader: StringReader, terminator?: RegExp) {
	if (!(reader.peek() === "'" || reader.peek() === '"') || reader.peek() === "`") {
		if (terminator !== undefined)
			return reader.readUntil(terminator);
		else
			return reader.readWord();
	}

	// potentially slow :(
	// substring is likely to be highly optimised
	// probably doesn't matter though - this just seems like it could be a lukewarm path

	let result = "";

	const endQuote = reader.read();
	const escapedQuote = endQuote + endQuote;

	while (reader.read() !== endQuote) {
		if (!reader.canRead())
			return null;

		result += reader.peek(0);

		if (reader.skipOver(escapedQuote))
			result += endQuote;
	}

	return result;
}

export function readSnowflake(reader: StringReader): string | null {
	const id = reader.readWord();

	if (!isSnowflake(id))
		return null;

	return id;
}

export function readUser(reader: StringReader): string | null {
	return readMention(reader, "@");
}

export function readRole(reader: StringReader): string | null {
	return readMention(reader, "&");
}

export function readChannel(reader: StringReader): string | null {
	return readMention(reader, "#");
}

function readMention(reader: StringReader, prefix: "@" | "&" | "#"): string | null {
	if (!reader.skipOver("<" + prefix))
		return readSnowflake(reader);

	if (prefix === "@")
		reader.skipOver("!");

	const id = reader.readUntil(">");
	reader.read(); // skip trailing >

	if (!isSnowflake(id))
		return null;

	return id;
}
