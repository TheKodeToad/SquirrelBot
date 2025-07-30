import { messageTemplate } from "#common/schema/message.ts";
import { ParameterType } from "#common/template/index.ts";
import { eventConfig } from "#plugin/logging/config/index.ts";
import { z } from "zod/v4";

export const messageEditEvent = eventConfig(
	z.strictObject({
		message: messageTemplate({
			author: ParameterType.User,
			author_avatar: ParameterType.MarkdownString,
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
				footer: { text: "Author ID: {{author#id}}" },
			}]
		}
	}
);

export const messageDeleteEvent = eventConfig(
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
				footer: { text: "Author ID: {{author#id}}" },
			}]
		}
	}
);
