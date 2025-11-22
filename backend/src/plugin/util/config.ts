import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import { z } from "zod/v4";

export const UtilConfig = z.strictObject({
	default_permissions: z
		.strictObject({
			invite_info_command: z.boolean().default(false),
			ping_command: z.boolean().default(false),
			snowflake_command: z.boolean().default(false),
		})
		.prefault({}),
	permission_overrides: z
		.strictObject({
			invite_info_command: z.boolean(),
			ping_command: z.boolean(),
			snowflake_command: z.boolean(),
			...PermissionsFilter.shape,
		})
		.partial()
		.array()
		.default([]),
});
