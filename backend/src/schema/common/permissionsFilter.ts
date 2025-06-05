import { NumberFilter } from "#schema/common/numberFilter.ts";
import type { InferOutput } from "valibot";
import { array, object, optional, string } from "valibot";

export const PermissionsFilter = object({
	in_group: optional(array(string())),
	in_channel: optional(array(string())),
	in_channel_category: optional(array(string())),
	in_thread: optional(array(string())),
	level: optional(NumberFilter),
});
export type PermissionsFilter = InferOutput<typeof PermissionsFilter>;
