import { array, boolean, object, optional } from "valibot";
import { permissions_filter_schema } from "../common/permissions_filter.ts";

export const util_config_schema = object({
	default_permissions: optional(object({
		invite_command: optional(boolean(), false),
		ping_command: optional(boolean(), false),
		snowflake_command: optional(boolean(), false),
	}), {}),
	permission_overrides: optional(array(object({
		invite_command: optional(boolean()),
		ping_command: optional(boolean()),
		snowflake_command: optional(boolean()),
		...permissions_filter_schema.entries
	})), []),
});