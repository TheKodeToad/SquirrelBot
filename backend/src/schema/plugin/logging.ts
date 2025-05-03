import { array, boolean, object, optional, union, type InferOutput } from "valibot";
import { snowflakeSchema } from "../common/index.ts";

export const eventConfigSchema = optional(union([boolean(), object({})]));
export type EventConfigSchema = InferOutput<typeof eventConfigSchema>;

export const loggingConfigSchema = object({
	loggers: array(object({
		channel_id: snowflakeSchema,
		// for now you can't customise each event
		events: object({
			message_edit: eventConfigSchema,
			message_delete: eventConfigSchema,
		})
	})),
});
