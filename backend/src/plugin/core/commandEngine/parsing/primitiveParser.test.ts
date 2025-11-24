import {
	CENTURY,
	DAY,
	DECADE,
	HOUR,
	humanizeDuration,
	MINUTE,
	MONTH,
	SECOND,
	WEEK,
	YEAR,
} from "#common/time.ts";
import {
	readBoolean,
	readDuration,
	readInteger,
	readNumber,
	readString,
} from "#plugin/core/commandEngine/parsing/primitiveParser.ts";
import { StringReader } from "#plugin/core/commandEngine/parsing/stringReader.ts";
import assert from "node:assert";
import test, { suite } from "node:test";

function parse<T>(input: string, read: (reader: StringReader) => T): T | null {
	const reader = new StringReader(input);
	const result = read(reader);

	if (reader.canRead()) {
		return null;
	}

	return result;
}

test("boolean parsing", () => {
	assert.equal(parse("false", readBoolean), false);
	assert.equal(parse("true", readBoolean), true);

	assert.equal(parse("f", readBoolean), false);
	assert.equal(parse("t", readBoolean), true);

	assert.equal(parse("0", readBoolean), false);
	assert.equal(parse("1", readBoolean), true);

	assert.equal(parse("fal", readBoolean), null);
	assert.equal(parse("falsey", readBoolean), null);
});

test("integer parsing", () => {
	assert.equal(parse("1234", readInteger), 1234);
	assert.equal(parse("9007199254740992", readInteger), null);
	assert.equal(parse("1.0", readInteger), 1);
	assert.equal(parse("1.01", readInteger), null);
	assert.equal(parse("NaN", readInteger), null);
	assert.equal(parse("0a", readInteger), null);
});

test("number parsing", () => {
	assert.equal(parse("1234", readNumber), 1234);
	assert.equal(parse("1e9999", readNumber), null);
	assert.equal(parse("1.0", readNumber), 1);
	assert.equal(parse("1.01", readNumber), 1.01);
	assert.equal(parse("NaN", readNumber), null);
	assert.equal(parse("Infinity", readNumber), null);
	assert.equal(parse("-Infinity", readNumber), null);
	assert.equal(parse("0a", readNumber), null);
});

test("string parsing", () => {
	assert.equal(parse("'hello world'", readString), "hello world");
	assert.equal(parse("'hello world'a", readString), null);
	assert.equal(parse("''''", readString), "'");
	assert.equal(parse("'hello ''tim'''", readString), "hello 'tim'");
	assert.equal(parse("'hello", readString), null);
	assert.equal(parse("'hello ''", readString), null);
});

suite("duration parsing", () => {
	const check = (input: string, expected: number): void => {
		const result = parse(input, readDuration);

		if (result === null) {
			throw new Error(`Invalid input: '${input}'`);
		}

		assert.equal(
			result,
			expected,
			`'${humanizeDuration(result)}' == '${humanizeDuration(expected)}' (input: '${input}')`,
		);
	};

	// mundane stuff which users will expect to work

	test("mundane long inputs", () => {
		check("1 millisecond", 1);
		check("1 second", SECOND);
		check("1 minute", MINUTE);
		check("1 hour", HOUR);
		check("1 day", DAY);
		check("1 month", MONTH);
		check("1 year", YEAR);
	});

	test("mundane long combined inputs", () => {
		check("1 second and 1 millisecond", SECOND + 1);
		check("1 minute and 30 seconds", MINUTE + 30 * SECOND);
		check("1 hour and 30 minutes", HOUR + 30 * MINUTE);
		check("1 day and 12 hours", DAY + 12 * HOUR);
		check("1 week and 4 days", WEEK + 4 * DAY);
		check("1 month and 2 weeks", MONTH + 2 * WEEK);
		check("1 year and 6 months", YEAR + 6 * MONTH);
	});

	test("mundane short inputs", () => {
		check("1ms", 1);
		check("1s", SECOND);
		check("1m", MINUTE);
		check("1h", HOUR);
		check("1d", DAY);
		check("1mo", MONTH);
		check("1y", YEAR);
	});

	test("mundane long combined inputs", () => {
		check("1s1ms", SECOND + 1);
		check("1m30s", MINUTE + 30 * SECOND);
		check("1h30m", HOUR + 30 * MINUTE);
		check("1d12h", DAY + 12 * HOUR);
		check("1w4d", WEEK + 4 * DAY);
		check("1mo2w", MONTH + 2 * WEEK);
		check("1y6mo", YEAR + 6 * MONTH);
	});

	test("wacky as heck inputs", () => {
		check("1MILLISECOND", 1);
		check("1SECOND", SECOND);
		check("1MINUTE", MINUTE);
		check("1HOUR", HOUR);
		check("1DAY", DAY);
		check("1MONTH", MONTH);
		check("1YEAR", YEAR);

		check("1 MS", 1);
		check("1 S", SECOND);
		check("1 M", MINUTE);
		check("1 H", HOUR);
		check("1 D", DAY);
		check("1 MO", MONTH);
		check("1 Y", YEAR);

		check("1y,,,,, AND 6 MO", YEAR + 6 * MONTH);
		check("1y,,,,, AND,,,, 6 MO", YEAR + 6 * MONTH);
		check(
			"1 yr ,,, , , , ,,, ,, 6 mo ,,,, 6 minute",
			YEAR + 6 * MONTH + 6 * MINUTE,
		);

		check("1 century", CENTURY);
		check("1 decade", DECADE);
	});
});
