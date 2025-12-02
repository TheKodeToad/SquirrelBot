import { PermissionsFilter } from "#common/schemas/permissionsFilter.ts";
import { z } from "zod";

export const RemindersConfig = z.strictObject({
	defaultPermissions: z
		.strictObject({
			personalReminders: z.boolean().default(false),
			manageReminders: z.boolean().default(false),
		})
		.prefault({}),
	permissionOverrides: z
		.strictObject({
			personalReminders: z.boolean().optional(),
			manageReminders: z.boolean().optional(),
			...PermissionsFilter.shape,
		})
		.array()
		.default([]),
});
