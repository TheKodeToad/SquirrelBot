import { NumberFilter } from "#common/schema/numberFilter.ts";
import type { InferOutput } from "valibot";
import { array, optional, strictObject, string } from "valibot";

export const PermissionsFilter = strictObject({
	in_group: optional(array(string())),
	in_channel: optional(array(string())),
	in_channel_category: optional(array(string())),
	in_thread: optional(array(string())),
	level: optional(NumberFilter),
});
export type PermissionsFilter = InferOutput<typeof PermissionsFilter>;
