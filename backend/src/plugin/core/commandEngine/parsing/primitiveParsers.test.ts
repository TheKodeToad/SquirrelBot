import { StringReader } from "#common/stringReader.ts";
import {
	readInteger,
	readNumber,
	readString,
} from "#plugin/core/commandEngine/parsing/primitiveParsers.ts";
import assert from "node:assert";
import test from "node:test";

function parse<T>(input: string, read: (reader: StringReader) => T): T | null {
	const reader = new StringReader(input);
	const result = read(reader);

	if (reader.canRead()) {
		return null;
	}

	return result;
}

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
