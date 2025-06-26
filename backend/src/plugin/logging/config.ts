import { Snowflake } from "#common/schema/general.ts";
import { array, boolean, description, optional, pipe, strictObject, union, type InferOutput } from "valibot";

export const EventConfig = optional(union([boolean(), strictObject({})]));
export type EventConfig = InferOutput<typeof EventConfig>;

export const LoggingConfig = strictObject({
	loggers: pipe(
		array(
			strictObject({
				channel: Snowflake,
				// for now you can't customise each event
				events: pipe(
					strictObject({
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
