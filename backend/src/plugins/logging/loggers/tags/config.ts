import { messageTemplate } from "#common/schemas/message.ts";
import { eventConfig } from "#plugins/logging/config.ts";
import {
	TagCreateView,
	TagDeleteView,
	TagEditView,
} from "#plugins/logging/loggers/tags/views.ts";

export const TagCreateEvent = eventConfig(messageTemplate(TagCreateView), {
	embeds: [
		{
			title: "Created Tag",
			author: {
				name: "{{actor.tag}}",
				iconURL: "{{actor.avatar}}",
			},
			description: "{{tag.name}}",
			fields: [
				{
					name: "Content",
					value: "{{tag.content}}",
				},
			],
			color: "green",
			footer: { text: "Actor ID: {{actor.id}}" },
		},
	],
});

export const TagEditEvent = eventConfig(messageTemplate(TagEditView), {
	embeds: [
		{
			title: "Edited Tag",
			author: {
				name: "{{actor.tag}}",
				iconURL: "{{actor.avatar}}",
			},
			description:
				"{{#nameChanged}}{{oldTag.name}} → {{/nameChanged}}{{newTag.name}}",
			fields: [
				{
					name: "Old Content",
					value: "{{#contentChanged}}{{oldTag.content}}{{/contentChanged}}",
				},
				{
					name: "New Content",
					value: "{{#contentChanged}}{{newTag.content}}{{/contentChanged}}",
				},
				{
					name: "Color",
					value: "{{#colorChanged}}{{oldTag.color}} → {{newTag.color}}{{/colorChanged}}",
				},
				{
					name: "Old Attachments",
					value: "{{#attachmentsChanged}}{{#oldTag.attachments}}{{.}}\n{{/oldTag.attachments}}{{/attachmentsChanged}}",
				},
				{
					name: "New Attachments",
					value: "{{#attachmentsChanged}}{{#newTag.attachments}}{{.}}\n{{/newTag.attachments}}{{/attachmentsChanged}}",
				},
			],
			color: "yellow",
			footer: { text: "Actor ID: {{actor.id}}" },
		},
	],
});

export const TagDeleteEvent = eventConfig(messageTemplate(TagDeleteView), {
	embeds: [
		{
			title: "Deleted Tag",
			author: {
				name: "{{actor.tag}}",
				iconURL: "{{actor.avatar}}",
			},
			description: "{{tag.name}}",
			fields: [
				{
					name: "Content",
					value: "{{tag.content}}",
				},
			],
			color: "red",
			footer: { text: "Actor ID: {{actor.id}}" },
		},
	],
});
