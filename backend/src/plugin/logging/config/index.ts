/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { APP_NAME } from "#brand.ts";
import { Snowflake } from "#common/schema/general.ts";
import { MemberJoinEvent, MemberLeaveEvent } from "#plugin/logging/config/members.ts";
import { MessageDeleteEvent, MessageEditEvent } from "#plugin/logging/config/messages.ts";
import { UserBanEvent } from "#plugin/logging/config/modEvents.ts";
import { RoleCreateEvent, RoleDeleteEvent, RoleUpdateEvent } from "#plugin/logging/config/roles.ts";
import { z } from "zod/v4";

export function eventConfig<T extends z.ZodType>(object: T, defaultObject: z.input<T>) {
	const defaultTransformed = object.parse(defaultObject);

	return z.union([
		z.boolean(),
		object,
	]).optional().transform(input => input === true ? defaultTransformed : (input ?? false));
}

export const LoggerConfig = z.strictObject({
	channel: Snowflake,
	displayName: z.string().default(APP_NAME + " Logging"),
	avatar: z.url().optional(),
	events: z.strictObject({
		message_edit: MessageEditEvent,
		message_delete: MessageDeleteEvent,

		member_join: MemberJoinEvent,
		member_leave: MemberLeaveEvent,

		role_create: RoleCreateEvent,
		role_update: RoleUpdateEvent,
		role_delete: RoleDeleteEvent,

		user_ban: UserBanEvent,
	}).describe("Customize what happens when events happen in the server — set them to true to use the default presentation")
});

export type LoggerConfig = z.output<typeof LoggerConfig>;

export const LoggingConfig = z.strictObject({
	loggers: LoggerConfig.array().describe("Specify logging for channels")
});
