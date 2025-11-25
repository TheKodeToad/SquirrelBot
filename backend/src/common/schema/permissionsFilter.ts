import { Snowflake } from "#common/schema/general.ts";
import { NumberFilter } from "#common/schema/numberFilter.ts";
import { z } from "zod";

export const PermissionsFilter = z.strictObject({
	inGroup: z.string().array().optional(),
	inChannel: Snowflake.array().optional(),
	inChannelCategory: Snowflake.array().optional(),
	inThread: Snowflake.array().optional(),
	level: NumberFilter.optional(),
});
export type PermissionsFilter = z.output<typeof PermissionsFilter>;
