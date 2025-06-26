import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import { array, boolean, optional, strictObject } from "valibot";

export const UtilConfig = strictObject({
	default_permissions: optional(strictObject({
		invite_info_command: optional(boolean(), false),
		ping_command: optional(boolean(), false),
		snowflake_command: optional(boolean(), false),
	}), {}),
	permission_overrides: optional(array(strictObject({
		invite_info_command: optional(boolean()),
		ping_command: optional(boolean()),
		snowflake_command: optional(boolean()),
		...PermissionsFilter.entries
	})), []),
});
