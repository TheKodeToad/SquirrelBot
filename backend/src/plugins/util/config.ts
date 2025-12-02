import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import { z } from "zod";

export const UtilConfig = z.strictObject({
	defaultPermissions: z
		.strictObject({
			inviteInfoCommand: z.boolean().default(false),
			pingCommand: z.boolean().default(false),
			snowflakeCommand: z.boolean().default(false),
		})
		.prefault({}),
	permissionOverrides: z
		.strictObject({
			inviteInfoCommand: z.boolean(),
			pingCommand: z.boolean(),
			snowflakeCommand: z.boolean(),
			...PermissionsFilter.shape,
		})
		.partial()
		.array()
		.default([]),
});
