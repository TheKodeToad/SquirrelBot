import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import { z } from "zod";

export const RemindersConfig = z.strictObject({
	default_permissions: z.strictObject({
		personal_reminders: z.boolean().default(false),
		manage_reminders: z.boolean().default(false),
	}).prefault({}),
	permission_overrides: z.strictObject({
		personal_reminders: z.boolean().optional(),
		manage_reminders: z.boolean().optional(),
		...PermissionsFilter.shape
	}).array().default([]),
});
