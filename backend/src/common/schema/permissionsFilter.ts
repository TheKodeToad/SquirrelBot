import { Snowflake } from "#common/schema/general.ts";
import { NumberFilter } from "#common/schema/numberFilter.ts";
import { z } from "zod";

export const PermissionsFilter = z.strictObject({
	in_group: z.string().array().optional(),
	in_channel: Snowflake.array().optional(),
	in_channel_category: Snowflake.array().optional(),
	in_thread: Snowflake.array().optional(),
	level: NumberFilter.optional(),
});
export type PermissionsFilter = z.output<typeof PermissionsFilter>;
