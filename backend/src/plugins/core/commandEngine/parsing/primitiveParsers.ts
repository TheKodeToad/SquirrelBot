import { isSnowflake } from "#common/snowflakes.ts";
import type { StringReader } from "#common/stringReader.ts";

export function readInteger(reader: StringReader): number | null {
	const result = Number(reader.readWord());

	if (!Number.isSafeInteger(result)) {
		return null;
	}

	return result;
}

export function readNumber(reader: StringReader): number | null {
	const result = Number(reader.readWord());

	if (!Number.isFinite(result)) {
		return null;
	}

	return result;
}

/**
 * Read a quoted or unquoted string.
 * @param reader StringReader instance
 * @param terminator The pattern to terminate the string if unquoted - defaults to space
 */
export function readString(
	reader: StringReader,
	terminator?: RegExp,
): string | null {
	if (
		!(reader.peek() === "'" || reader.peek() === '"')
		|| reader.peek() === "`"
	) {
		if (terminator !== undefined) {
			return reader.readUntil(terminator);
		} else {
			return reader.readWord();
		}
	}

	// potentially slow :(
	// substring is likely to be highly optimised
	// probably doesn't matter though - this just seems like it could be a lukewarm path

	let result = "";

	const endQuote = reader.read();

	while (reader.canRead()) {
		if (reader.skipOver(endQuote)) {
			if (!reader.skipOver(endQuote)) {
				return result;
			} else {
				result += endQuote;
				continue;
			}
		}

		result += reader.read();
	}

	return null;
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

function readMention(
	reader: StringReader,
	prefix: "@" | "&" | "#",
): string | null {
	if (!reader.skipOver("<" + prefix)) {
		const id = reader.readWord();

		if (!isSnowflake(id)) {
			return null;
		}

		return id;
	}

	if (prefix === "@") {
		reader.skipOver("!");
	}

	const id = reader.readUntil(">");
	reader.read(); // skip trailing >

	if (!isSnowflake(id)) {
		return null;
	}

	return id;
}
