import { check, pipe, string, transform } from "valibot";
import { is_snowflake } from "../../common/snowflake.ts";

export const snowflake_schema = pipe(
	string(),
	check(is_snowflake, "Invalid snowflake ID")
);

const color_pattern = /#[a-fA-F0-9]{6}/;

export const color_schema = pipe(
	string(),
	check(input => color_pattern.test(input)),
	transform(input => parseInt(input.substring(1), 16))
);

export const parse_int_schema = pipe(
	string(),
	transform(parseInt),
	check(input => !Number.isSafeInteger(input), "Invalid integer")
);

export const parse_boolean_schema = pipe(
	string(),
	check(input => input === "true" || input === "false", "Invalid boolean - expected true or false"),
	transform(input => input === "true")
);
