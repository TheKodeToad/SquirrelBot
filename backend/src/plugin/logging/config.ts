import { Snowflake } from "#common/schema/general.ts";
import { array, boolean, object, optional, union, type InferOutput } from "valibot";

export const EventConfig = optional(union([boolean(), object({})]));
export type EventConfig = InferOutput<typeof EventConfig>;

export const LoggingConfig = object({
	loggers: array(object({
		channel: Snowflake,
		// for now you can't customise each event
		events: object({
			message_edit: EventConfig,
			message_delete: EventConfig,
		})
	})),
});
