import { array, boolean, object, optional } from "valibot";
import { permissionsFilterSchema } from "../common/permissionsFilter.ts";

export const remindersConfigSchema = object({
	default_permissions: optional(object({
		personal_reminders: optional(boolean(), false),
		manage_reminders: optional(boolean(), false),
	}), {}),
	permission_overrides: optional(array(object({
		personal_reminders: optional(boolean()),
		manage_reminders: optional(boolean()),
		...permissionsFilterSchema.entries
	})), []),
});