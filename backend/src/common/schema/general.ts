import { colors } from "#common/discord/colors.ts";
import { isSnowflake } from "#common/snowflake.ts";
import { check, literal, pipe, string, transform, union } from "valibot";

export const Snowflake = pipe(
	string(),
	check(isSnowflake, "Invalid snowflake ID")
);

const colorPattern = /#[a-fA-F0-9]{6}/;

export const HexColor = pipe(
	string(),
	check(input => colorPattern.test(input), "Not a valid hex colour"),
	transform(input => parseInt(input.substring(1), 16))
);

export const NamedColor = pipe(
	string(),
	check(input => Object.hasOwn(colors, input), "Not a valid color name"),
	transform(input => colors[input as keyof typeof colors])
);

export const Color = union([HexColor, NamedColor]);

export const parseIntSchema = pipe(
	string(),
	transform(parseInt),
	check(input => Number.isSafeInteger(input), "Invalid integer")
);

export const parseBooleanSchema = pipe(
	union([literal("true"), literal("false")]),
	transform(input => input === "true")
);
