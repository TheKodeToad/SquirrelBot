import { messageTemplate } from "#common/schema/message.ts";
import { UserView } from "#common/template/user.ts";
import { eventConfig } from "#plugin/logging/config/index.ts";
import { m, type InferView } from "mousetache";

export const MessageLogView = m.object({
	content: m.terminal(),
});
export type MessageLogView = InferView<typeof MessageLogView>;

export const MessageEditEvent = eventConfig(
	messageTemplate(
		m.object({
			author: UserView,
			oldMessage: MessageLogView,
			newMessage: MessageLogView,
		}),
	),
	{
		embeds: [
			{
				title: "Message Edited",
				author: {
					name: "{{author.tag}}",
					iconURL: "{{author.avatar}}",
				},
				fields: [
					{
						name: "Old Content",
						value: "{{oldMessage.content}}{{^oldMessage.content}}Unknown{{/oldMessage.content}}",
					},
					{ name: "New Content", value: "{{newMessage.content}}" },
				],
				color: "yellow",
				footer: { text: "Author ID: {{author.id}}" },
			},
		],
	},
);

export const MessageDeleteEvent = eventConfig(
	messageTemplate(
		m.object({
			author: UserView,
			message: MessageLogView,
		}),
	),
	{
		embeds: [
			{
				title: "Message Deleted",
				author: {
					name: "{{author.tag}}",
					iconURL: "{{author.avatar}}",
				},
				description: "{{message.content}}",
				color: "red",
				footer: { text: "Author ID: {{author.id}}" },
			},
		],
	},
);
