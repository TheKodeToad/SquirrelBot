import { colors } from "#bot/common/discord/colors.ts";
import { isSnowflake } from "#common/snowflake.ts";
import { check, pipe, string, transform, union } from "valibot";

export const snowflakeSchema = pipe(
	string(),
	check(isSnowflake, "Invalid snowflake ID")
);

const colorPattern = /#[a-fA-F0-9]{6}/;

export const hexColorSchema = pipe(
	string(),
	check(input => colorPattern.test(input), "Not a valid hex colour"),
	transform(input => parseInt(input.substring(1), 16))
);

export const namedColourSchema = pipe(
	string(),
	check(input => Object.hasOwn(colors, input), "Not a valid color name"),
	transform(input => colors[input as keyof typeof colors])
);

export const colorSchema = union([hexColorSchema, namedColourSchema]);

export const parseIntSchema = pipe(
	string(),
	transform(parseInt),
	check(input => Number.isSafeInteger(input), "Invalid integer")
);

export const parseBooleanSchema = pipe(
	string(),
	check(input => input === "true" || input === "false", "Invalid boolean - expected true or false"),
	transform(input => input === "true")
);
