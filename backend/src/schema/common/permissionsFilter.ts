import { numberFilterSchema } from "#schema/common/numberFilter.ts";
import type { InferOutput } from "valibot";
import { array, object, optional, string } from "valibot";

export const permissionsFilterSchema = object({
	in_group: optional(array(string())),
	in_channel: optional(array(string())),
	in_channel_category: optional(array(string())),
	in_thread: optional(array(string())),
	level: optional(numberFilterSchema),
});
export type PermissionsFilter = InferOutput<typeof permissionsFilterSchema>;
