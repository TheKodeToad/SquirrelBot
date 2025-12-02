import { Color } from "#common/schema/general.ts";
import type { StringReader } from "#common/stringReader.ts";

const CLEAR_PATTERN = /clear\b/iy;

export const attachments = {
	name: "attachments",
	read(reader: StringReader) {
		if (reader.skipOver(CLEAR_PATTERN)) {
			return [];
		}

		const result = [];

		while (reader.canRead()) {
			const prevCursor = reader.cursor;
			const url = reader.readWord();

			if (!(url.startsWith("https://") || url.startsWith("http://"))) {
				reader.cursor = prevCursor;
				break;
			}

			result.push(url);
		}

		return result;
	},
};

/** Parses a color or returns -1 if none is supplied. */
export const optionalColor = {
	name: "color",
	read(reader: StringReader) {
		const word = reader.readWord();

		if (word.toLowerCase() === "none") {
			return -1;
		}

		const result = Color.safeParse(word);

		if (!result.success) {
			return null;
		}

		return result.data;
	},
};
