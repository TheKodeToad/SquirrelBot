import { InferOutput, number, object, optional, string } from "valibot";

export const permissions_filter_schema = object({
	in_group: optional(string()),
	above_group: optional(string()),
	above_or_in_group: optional(string()),
	below_group: optional(string()),
	below_or_in_group: optional(string()),
	at_level: optional(number()),
	above_level: optional(number()),
	above_or_at_level: optional(number()),
	below_level: optional(number()),
	below_or_at_level: optional(number()),
});
export type PermissionsFilter = InferOutput<typeof permissions_filter_schema>;