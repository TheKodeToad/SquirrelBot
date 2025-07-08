import { Snowflake } from "#common/schema/general.ts";
import { z } from "zod/v4";

export const EventConfig = z.optional(z.union([z.boolean(), z.strictObject({})]));
export type EventConfig = z.output<typeof EventConfig>;

export const LoggingConfig = z.strictObject({
	loggers: z.strictObject({
		channel: Snowflake,
		// for now you can't customise each event
		events: z.strictObject({
			message_edit: EventConfig,
			message_delete: EventConfig,
		}).describe("Customize what happens when events happen in the server — set them to true to use the default presentation")
	}).array().describe("Specify logging for channels")
});
