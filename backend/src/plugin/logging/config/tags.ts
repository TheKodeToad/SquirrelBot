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
					icon_url: "{{actor.avatar}}",
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

			old_tag: TagView,
			new_tag: TagView,

			name_changed: m.terminal(),
			content_changed: m.terminal(),
		}),
	),
	{
		embeds: [
			{
				title: "Edited Tag",
				author: {
					name: "{{actor.tag}}",
					icon_url: "{{actor.avatar}}",
				},
				fields: [
					{
						name: "Name",
						value: "{{#name_changed}}{{old_tag.name}} → {{new_tag.name}}{{/name_changed}}{{^name_changed}}{{new_tag.name}}{{/name_changed}}",
					},
					{
						name: "Old Content",
						value: "{{#content_changed}}{{old_tag.content}}{{/content_changed}}",
					},
					{
						name: "New Content",
						value: "{{#content_changed}}{{new_tag.content}}{{/content_changed}}",
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
					icon_url: "{{actor.avatar}}",
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
