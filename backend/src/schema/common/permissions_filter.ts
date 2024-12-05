import { array, InferOutput, object, optional, string } from "valibot";
import { number_filter_schema } from "./number_filter";

export const permissions_filter_schema = object({
	in_group: optional(array(string())),
	in_channel: optional(array(string())),
	in_channel_category: optional(array(string())),
	in_thread: optional(array(string())),
	level: optional(number_filter_schema),
});
export type PermissionsFilter = InferOutput<typeof permissions_filter_schema>;