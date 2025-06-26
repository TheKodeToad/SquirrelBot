import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import { array, boolean, optional, strictObject } from "valibot";

export const RemindersConfig = strictObject({
	default_permissions: optional(strictObject({
		personal_reminders: optional(boolean(), false),
		manage_reminders: optional(boolean(), false),
	}), {}),
	permission_overrides: optional(array(strictObject({
		personal_reminders: optional(boolean()),
		manage_reminders: optional(boolean()),
		...PermissionsFilter.entries
	})), []),
});
