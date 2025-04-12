import { check, pipe, string, transform } from "valibot";
import { isSnowflake } from "../../common/snowflake.ts";

export const snowflakeSchema = pipe(
	string(),
	check(isSnowflake, "Invalid snowflake ID")
);

const colorPattern = /#[a-fA-F0-9]{6}/;

export const colorSchema = pipe(
	string(),
	check(input => colorPattern.test(input)),
	transform(input => parseInt(input.substring(1), 16))
);

export const parseIntSchema = pipe(
	string(),
	transform(parseInt),
	check(input => !Number.isSafeInteger(input), "Invalid integer")
);

export const parseBooleanSchema = pipe(
	string(),
	check(input => input === "true" || input === "false", "Invalid boolean - expected true or false"),
	transform(input => input === "true")
);
