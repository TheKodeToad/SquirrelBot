import { colors } from "#common/discord/colors.ts";
import { isSnowflake } from "#common/snowflake.ts";
import { z } from "zod/v4";
import type { $ZodEnumParams } from "zod/v4/core";

export const Snowflake = z.string().refine(isSnowflake, { error: "Invalid Discord ID (AKA snowflake)" });

const colorPattern = /#[a-fA-F0-9]{6}/;

export const HexColor = z.string().regex(colorPattern).transform((color, ctx) => {
	const result = parseInt(color.substring(1), 16);

	if (Number.isNaN(result)) {
		ctx.addIssue("Invalid color specification");
		return z.NEVER;
	}
});

export const NamedColor = z.enum(Object.keys(colors))
	.transform((name, ctx) => {
		if (!Object.hasOwn(colors, name)) {
			ctx.addIssue("Invalid color name");
			return z.NEVER;
		}

		return colors[name as keyof typeof colors]!;
	});;

export const Color = z.union([HexColor, NamedColor]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function mappedEnum<I extends string, O>(map: Readonly<Record<I, O>>, params?: string | $ZodEnumParams) {
	return z.enum(Object.keys(map) as I[], params).transform(input => map[input]);
}
