import { colors } from "#common/discord/colors.ts";
import { isSnowflake } from "#common/snowflake.ts";
import { z } from "zod/v4";

export const Snowflake = z.string().refine(isSnowflake, { error: "Invalid Discord ID (AKA snowflake)" });

const colorPattern = /#[a-fA-F0-9]{6}/;

export const HexColor = z.string().regex(colorPattern).transform((color, context) => {
	const result = parseInt(color.substring(1), 16);

	if (Number.isNaN(result)) {
		context.addIssue("Invalid color specification");
		return z.NEVER;
	}
});

export const NamedColor = z.enum(Object.keys(colors))
	.transform((name, context) => {
		if (!Object.hasOwn(colors, name)) {
			context.addIssue("Invalid color name");
			return z.NEVER;
		}

		return colors[name as keyof typeof colors];
	});;

export const Color = z.union([HexColor, NamedColor]);
