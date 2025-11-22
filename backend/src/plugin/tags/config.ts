import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import z from "zod";

export const TagsConfig = z.object({
	default_permissions: z.strictObject({
		tag_send: z.boolean().default(true),
		tag_create: z.boolean().default(false),
		tag_edit: z.boolean().default(false),
		tag_delete: z.boolean().default(false),
	}).prefault({}),
	permission_overrides: z.strictObject({
		tag_send: z.boolean().optional(),
		tag_create: z.boolean().optional(),
		tag_edit: z.boolean().optional(),
		tag_delete: z.boolean().optional(),
		...PermissionsFilter.shape
	}).array().default([]),
});
