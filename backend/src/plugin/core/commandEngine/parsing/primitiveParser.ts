import { isSnowflake } from "#common/snowflake.ts";
import {
	CENTURY,
	DAY,
	DECADE,
	HOUR,
	MILLENIUM,
	MINUTE,
	MONTH,
	SECOND,
	WEEK,
	YEAR,
} from "#common/time.ts";
import type { StringReader } from "#plugin/core/commandEngine/parsing/stringReader.ts";

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
		!(reader.peek() === "'" || reader.peek() === '"') ||
		reader.peek() === "`"
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

export function readSnowflake(reader: StringReader): string | null {
	const id = reader.readWord();

	if (!isSnowflake(id)) {
		return null;
	}

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

function readMention(
	reader: StringReader,
	prefix: "@" | "&" | "#",
): string | null {
	if (!reader.skipOver("<" + prefix)) {
		return readSnowflake(reader);
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

const DURATION_UNIT_BOUNDARY = /[A-Za-z\s]/g;
const DURATION_LENGTH_BOUNDARY = /[^A-Za-z]/g;
const DURATION_SEPARATOR = /(,|\s|and)*/iy;

export function readDuration(reader: StringReader): number | null {
	let total = null;

	let prevCursor = reader.cursor;

	while (reader.canRead()) {
		const lengthString = reader.readUntil(DURATION_UNIT_BOUNDARY);
		const length = parseFloat(lengthString);

		if (Number.isNaN(length)) {
			reader.cursor = prevCursor;
			break;
		}

		reader.skipWhitespace();

		if (!reader.canRead()) {
			reader.cursor = prevCursor;
			break;
		}

		const unit = reader.readUntil(DURATION_LENGTH_BOUNDARY).toLowerCase();

		const ms = durationToMS(length, unit);

		if (ms === null) {
			reader.cursor = prevCursor;
			break;
		}

		total ??= 0;
		total += ms;

		prevCursor = reader.cursor;
		reader.skipOver(DURATION_SEPARATOR);
	}

	if (!Number.isSafeInteger(total)) {
		return null;
	}

	return total;
}

function durationToMS(length: number, unit: string): number | null {
	switch (unit) {
		case "ms":
		case "millisecond":
		case "milliseconds":
			return length;

		case "s":
		case "sec":
		case "secs":
		case "second":
		case "seconds":
			return length * SECOND;

		case "m":
		case "min":
		case "mins":
		case "minute":
		case "minutes":
			return length * MINUTE;

		case "h":
		case "hr":
		case "hrs":
		case "hour":
		case "hours":
			return length * HOUR;

		case "d":
		case "dy":
		case "dys":
		case "day":
		case "days":
			return length * DAY;

		case "w":
		case "wk":
		case "wks":
		case "week":
		case "weeks":
			return length * WEEK;

		case "mo":
		case "mon":
		case "month":
		case "months":
			return length * MONTH;

		case "y":
		case "yr":
		case "yrs":
		case "year":
		case "years":
			return length * YEAR;

		case "dc":
		case "dcs":
		case "dec":
		case "decs":
		case "decade":
		case "decades":
			return length * DECADE;

		case "c":
		case "cs":
		case "cent":
		case "cents":
		case "century":
		case "centuries":
			return length * CENTURY;

		case "mi":
		case "mis":
		case "mil":
		case "mils":
		case "mill":
		case "mills":
		case "millenium":
		case "millenia":
			return length * MILLENIUM;

		default:
			return null;
	}
}
