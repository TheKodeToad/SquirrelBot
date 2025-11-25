import { messageTemplate } from "#common/schema/message.ts";
import { GuildView } from "#common/template/guild.ts";
import { UserView } from "#common/template/user.ts";
import { eventConfig } from "#plugin/logging/config/index.ts";
import { m } from "mousetache";

export const TagView = m.object({
	name: m.terminal(),
	content: m.terminal(),
});

export const TagCreateEvent = eventConfig(
	messageTemplate(
		m.object({
			guild: GuildView,
			actor: UserView,
			tag: TagView,
		}),
	),
	{
		embeds: [
			{
				title: "Created Tag",
				author: {
					name: "{{actor.tag}}",
					iconURL: "{{actor.avatar}}",
				},
				fields: [
					{
						name: "Name",
						value: "{{tag.name}}",
					},
					{
						name: "Content",
						value: "{{tag.content}}",
					},
				],
				color: "green",
				footer: { text: "Actor ID: {{actor.id}}" },
			},
		],
	},
);

export const TagEditEvent = eventConfig(
	messageTemplate(
		m.object({
			guild: GuildView,
			actor: UserView,

			oldTag: TagView,
			newTag: TagView,

			nameChanged: m.terminal(),
			contentChanged: m.terminal(),
		}),
	),
	{
		embeds: [
			{
				title: "Edited Tag",
				author: {
					name: "{{actor.tag}}",
					iconURL: "{{actor.avatar}}",
				},
				fields: [
					{
						name: "Name",
						value: "{{#nameChanged}}{{oldTag.name}} → {{newTag.name}}{{/nameChanged}}{{^nameChanged}}{{newTag.name}}{{/nameChanged}}",
					},
					{
						name: "Old Content",
						value: "{{#contentChanged}}{{oldTag.content}}{{/contentChanged}}",
					},
					{
						name: "New Content",
						value: "{{#contentChanged}}{{newTag.content}}{{/contentChanged}}",
					},
				],
				color: "yellow",
				footer: { text: "Actor ID: {{actor.id}}" },
			},
		],
	},
);

export const TagDeleteEvent = eventConfig(
	messageTemplate(
		m.object({
			guild: GuildView,
			actor: UserView,
			tag: TagView,
		}),
	),
	{
		embeds: [
			{
				title: "Deleted Tag",
				author: {
					name: "{{actor.tag}}",
					iconURL: "{{actor.avatar}}",
				},
				fields: [
					{
						name: "Name",
						value: "{{tag.name}}",
					},
					{
						name: "Content",
						value: "{{tag.content}}",
					},
				],
				color: "red",
				footer: { text: "Actor ID: {{actor.id}}" },
			},
		],
	},
);
