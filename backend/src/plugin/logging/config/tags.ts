import { paddedHex } from "#common/general.ts";
import { messageTemplate } from "#common/schema/message.ts";
import { GuildView } from "#common/template/guild.ts";
import { UserView } from "#common/template/user.ts";
import { eventConfig } from "#plugin/logging/config/index.ts";
import type { Tag } from "#plugin/tags/public/tag.ts";
import { m, type InferView } from "mousetache";

export const TagView = m.object({
	name: m.terminal(),
	content: m.terminal({ noEscape: true }),
	color: m.terminal({ noEscape: true }),
	attachments: m.array(m.terminal({ noEscape: true }))
});

export type TagView = InferView<typeof TagView>;

export function makeTagView(tag: Tag): TagView {
	return {
		name: tag.name,
		content: tag.content,
		get color() {
			if (tag.color !== -1) {
				return paddedHex(tag.color, 3)
			} else {
				return "None";
			}
		},
		attachments: tag.attachments,
	};
}

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
			colorChanged: m.terminal(),
			attachmentsChanged: m.terminal(),
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
	},
);
