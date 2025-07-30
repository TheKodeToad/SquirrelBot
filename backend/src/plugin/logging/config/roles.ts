import { messageTemplate } from "#common/schema/message.ts";
import { ParameterType } from "#common/template/index.ts";
import { eventConfig } from "#plugin/logging/config/index.ts";
import { z } from "zod/v4";

export const roleCreateEvent = eventConfig(
	z.strictObject({
		message: messageTemplate({
			user: ParameterType.User,
			user_avatar: ParameterType.MarkdownString,
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
				author: { name: "{{user#tag}}", icon_url: "{{user_avatar}}" },
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

export const roleUpdateEvent = eventConfig(
	z.strictObject({
		message: messageTemplate({
			user: ParameterType.User,
			user_avatar: ParameterType.MarkdownString,
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
				author: { name: "{{user#tag}}", icon_url: "{{user_avatar}}" },
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

export const roleDeleteEvent = eventConfig(
	z.strictObject({
		message: messageTemplate({
			user: ParameterType.User,
			user_avatar: ParameterType.MarkdownString,
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
				author: { name: "{{user#tag}}", icon_url: "{{user_avatar}}" },
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
