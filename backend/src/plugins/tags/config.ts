import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import z from "zod";

export const TagsConfig = z.strictObject({
	defaultPermissions: z
		.strictObject({
			tagSend: z.boolean().default(true),
			tagCreate: z.boolean().default(false),
			tagEdit: z.boolean().default(false),
			tagDelete: z.boolean().default(false),
		})
		.prefault({}),
	permissionOverrides: z
		.strictObject({
			tagSend: z.boolean().optional(),
			tagCreate: z.boolean().optional(),
			tagEdit: z.boolean().optional(),
			tagDelete: z.boolean().optional(),
			...PermissionsFilter.shape,
		})
		.array()
		.default([]),
});
