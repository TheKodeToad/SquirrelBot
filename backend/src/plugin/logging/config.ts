import { Snowflake } from "#common/schema/general.ts";
import { array, boolean, description, object, optional, pipe, union, type InferOutput } from "valibot";

export const EventConfig = optional(union([boolean(), object({})]));
export type EventConfig = InferOutput<typeof EventConfig>;

export const LoggingConfig = object({
	loggers: pipe(
		array(
			object({
				channel: Snowflake,
				// for now you can't customise each event
				events: pipe(
					object({
						message_edit: EventConfig,
						message_delete: EventConfig,
					}),
					description("Customize what happens when events happen in the server — set them to true to use the default presentation")
				)
			}),
		),
		description("Specify logging for channels")
	),
});
