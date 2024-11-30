import { InferOutput, object, optional, string } from "valibot";
import { number_filter_schema } from "./number_filter";

export const permissions_filter_schema = object({
	in_group: optional(string()),
	level: optional(number_filter_schema),
});
export type PermissionsFilter = InferOutput<typeof permissions_filter_schema>;