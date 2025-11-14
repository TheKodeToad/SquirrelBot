import { messageTemplate } from "#common/schema/message.ts";
import { UserView } from "#common/template/user.ts";
import { eventConfig } from "#plugin/logging/config/index.ts";
import { m, type InferView } from "mousetache";

export const MessageLogView = m.object({
	content: m.terminal(),
});
export type MessageLogView = InferView<typeof MessageLogView>;

export const MessageEditEvent = eventConfig(
	messageTemplate(m.object({
		author: UserView,
		old_message: MessageLogView,
		new_message: MessageLogView,
	})),
	{
		embeds: [{
			title: "Message Edited",
			author: { name: "{{author.tag}}", icon_url: "{{author.avatar}}" },
			fields: [
				{ name: "Old Content", value: "{{old_message.content}}{{^old_message.content}}Unknown{{/old_message.content}}", },
				{ name: "New Content", value: "{{new_message.content}}", }
			],
			color: "yellow",
			footer: { text: "Author ID: {{author.id}}" },
		}]
	}
);

export const MessageDeleteEvent = eventConfig(
	messageTemplate(m.object({
		author: UserView,
		message: MessageLogView,
	})),
	{
		embeds: [{
			title: "Message Deleted",
			author: { name: "{{author.tag}}", icon_url: "{{author.avatar}}" },
			description: "{{message.content}}",
			color: "red",
			footer: { text: "Author ID: {{author.id}}" },
		}]
	}
);
