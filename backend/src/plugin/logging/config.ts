/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { Snowflake } from "#common/schema/general.ts";
import { messageTemplate } from "#common/schema/message.ts";
import { ParameterType } from "#common/template/index.ts";
import { z } from "zod/v4";

function eventConfig<Z extends z.ZodObject>(object: Z, defaultObject: z.input<Z>) {
	const defaultTransformed = object.parse(defaultObject);

	return z.union([
		z.boolean(),
		object,
	]).optional().transform(input => input === true ? defaultTransformed : (input ?? false));
}

export const LoggerConfig = z.strictObject({
	channel: Snowflake,
	events: z.strictObject({
		message_edit: messageEditEvent(),
		message_delete: messageDeleteEvent(),
		role_create: roleCreateEvent(),
		role_update: roleUpdateEvent(),
		role_delete: roleDeleteEvent(),
	}).describe("Customize what happens when events happen in the server — set them to true to use the default presentation")
});

export type LoggerConfig = z.output<typeof LoggerConfig>;

export const LoggingConfig = z.strictObject({
	loggers: LoggerConfig.array().describe("Specify logging for channels")
});

function messageEditEvent() {
	return eventConfig(
		z.strictObject({
			message: messageTemplate({
				author: ParameterType.User,
				author_avatar: ParameterType.RawString,
				old_content: ParameterType.MarkdownString,
				new_content: ParameterType.MarkdownString
			})
		}),
		{
			message: {
				embeds: [{
					title: "Message Edited",
					author: { name: "{{author#tag}}", icon_url: "{{author_avatar}}" },
					fields: [
						{ name: "Old Content", value: "{{old_content}}", },
						{ name: "New Content", value: "{{new_content}}", }
					],
					color: "yellow",
				}]
			}
		}
	);
}

function messageDeleteEvent() {
	return eventConfig(
		z.strictObject({
			message: messageTemplate({
				author: ParameterType.User,
				author_avatar: ParameterType.RawString,
				content: ParameterType.MarkdownString,
			})
		}),
		{
			message: {
				embeds: [{
					title: "Message Deleted",
					author: { name: "{{author#tag}}", icon_url: "{{author_avatar}}" },
					fields: [
						{ name: "Content", value: "{{content}}", }
					],
					color: "red",
				}]
			}
		}
	);
}

function roleCreateEvent() {
	return eventConfig(
		z.strictObject({
			message: messageTemplate({
				by: ParameterType.User,
				role: ParameterType.Role,
				color: ParameterType.RawString,
				hoisted: ParameterType.RawString,
				mentionable: ParameterType.RawString,
			}),
		}),
		{
			message: {
				embeds: [{
					title: "Role Created",
					description: "{{role#mention}}",
					fields: [
						{ name: "Name", value: "{{role#name}}" },
						{ name: "Color", value: "{{color}}" },
						{ name: "Hoisted", value: "{{hoisted}}" },
						{ name: "Mentionable", value: "{{mentionable}}" },
					],
					color: "green",
				}]
			}
		}
	);
}

function roleUpdateEvent() {
	return eventConfig(
		z.strictObject({
			message: messageTemplate({
				by: ParameterType.User,
				role: ParameterType.Role,
				old_name: ParameterType.RawString,
				old_color: ParameterType.RawString,
				old_hoisted: ParameterType.RawString,
				old_mentionable: ParameterType.RawString,
				new_name: ParameterType.RawString,
				new_color: ParameterType.RawString,
				new_hoisted: ParameterType.RawString,
				new_mentionable: ParameterType.RawString,
			}),
		}),
		{
			message: {
				embeds: [{
					title: "Role Updated",
					description: "{{role#mention}}",
					fields: [
						{ name: "Name", value: "{{old_name}} → {{new_name}}" },
						{ name: "Color", value: "{{old_color}} → {{new_color}}" },
						{ name: "Hoisted", value: "{{old_hoisted}} → {{new_hoisted}}" },
						{ name: "Mentionable", value: "{{old_mentionable}} → {{new_mentionable}}" },
					],
					color: "yellow",
				}]
			}
		}
	);
}

function roleDeleteEvent() {
	return eventConfig(
		z.strictObject({
			message: messageTemplate({
				by: ParameterType.User,
				role: ParameterType.Role,
				color: ParameterType.RawString,
				hoisted: ParameterType.RawString,
				mentionable: ParameterType.RawString,
			}),
		}),
		{
			message: {
				embeds: [{
					title: "Role Deleted",
					fields: [
						{ name: "Name", value: "{{role#name}}" },
						{ name: "Color", value: "{{color}}" },
						{ name: "Hoisted", value: "{{hoisted}}" },
						{ name: "Mentionable", value: "{{mentionable}}" },
					],
					color: "red",
				}]
			}
		}
	);
}
