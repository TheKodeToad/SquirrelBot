import { messageTemplate } from "#common/schema/message.ts";
import { ParameterType } from "#common/template/index.ts";
import { eventConfig } from "#plugin/logging/config/index.ts";
import { z } from "zod/v4";

export const MemberJoinEvent = eventConfig(
	z.strictObject({
		message: messageTemplate({
			user: ParameterType.User,
			user_avatar: ParameterType.MarkdownString,
			user_created_at: ParameterType.Timestamp,
			user_age: ParameterType.Duration,
		})
	}),
	{
		message: {
			embeds: [{
				title: "Member Joined",
				author: { name: "{{user#tag}}", icon_url: "{{user_avatar}}" },
				fields: [
					{ name: "Account Created At", value: "{{user_created_at}} ({{user_age}} old)" }
				],
				color: "green",
				footer: { text: "User ID: {{user#id}}" },
			}]
		}
	}
);

export const MemberLeaveEvent = eventConfig(
	z.strictObject({
		message: messageTemplate({
			user: ParameterType.User,
			user_avatar: ParameterType.MarkdownString,
			user_created_at: ParameterType.Timestamp,
			user_age: ParameterType.Duration,
			user_joined_at: ParameterType.Timestamp,
			user_stay_duration: ParameterType.Duration,
		})
	}),
	{
		message: {
			embeds: [{
				title: "Member Left",
				author: { name: "{{user#tag}}", icon_url: "{{user_avatar}}" },
				fields: [
					{ name: "Joined At", value: "{{user_joined_at}} (stayed for {{user_stay_duration}})" },
				],
				color: "red",
				footer: { text: "User ID: {{user#id}}" },
			}]
		}
	}
);
