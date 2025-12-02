import { messageTemplate } from "#common/schemas/message.ts";
import { eventConfig } from "#plugins/logging/config.ts";
import {
	MessageDeleteView,
	MessageEditView,
} from "#plugins/logging/loggers/messages/views.ts";

export const MessageEditEvent = eventConfig(messageTemplate(MessageEditView), {
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
});

export const MessageDeleteEvent = eventConfig(
	messageTemplate(MessageDeleteView),
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
