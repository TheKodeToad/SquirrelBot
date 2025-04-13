import { array, boolean, object, optional } from "valibot";
import { permissionsFilterSchema } from "../common/permissionsFilter.ts";

export const utilConfigSchema = object({
	default_permissions: optional(object({
		invite_command: optional(boolean(), false),
		ping_command: optional(boolean(), false),
		snowflake_command: optional(boolean(), false),
	}), {}),
	permission_overrides: optional(array(object({
		invite_command: optional(boolean()),
		ping_command: optional(boolean()),
		snowflake_command: optional(boolean()),
		...permissionsFilterSchema.entries
	})), []),
});