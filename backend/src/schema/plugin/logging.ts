import { snowflakeSchema } from "#schema/common/index.ts";
import { array, boolean, object, optional, union, type InferOutput } from "valibot";

export const eventConfigSchema = optional(union([boolean(), object({})]));
export type EventConfigSchema = InferOutput<typeof eventConfigSchema>;

export const loggingConfigSchema = object({
	loggers: array(object({
		channel: snowflakeSchema,
		// for now you can't customise each event
		events: object({
			message_edit: eventConfigSchema,
			message_delete: eventConfigSchema,
		})
	})),
});
