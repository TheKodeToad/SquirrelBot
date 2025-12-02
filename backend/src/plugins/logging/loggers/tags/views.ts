import { paddedHex } from "#common/general.ts";
import { GuildView } from "#common/views/guild.ts";
import { UserView } from "#common/views/user.ts";
import type { Tag } from "#plugins/tags/public/tag.ts";
import { type InferView, m } from "mousetache";

export const TagView = m.object({
	name: m.terminal(),
	content: m.terminal({ noEscape: true }),
	color: m.terminal({ noEscape: true }),
	attachments: m.array(m.terminal({ noEscape: true })),
});

export type TagView = InferView<typeof TagView>;

export function makeTagView(tag: Tag): TagView {
	return {
		name: tag.name,
		content: tag.content,
		get color() {
			if (tag.color !== -1) {
				return paddedHex(tag.color, 3);
			} else {
				return "None";
			}
		},
		attachments: tag.attachments,
	};
}

export const TagCreateView = m.object({
	guild: GuildView,
	actor: UserView,
	tag: TagView,
});
export type TagCreateView = InferView<typeof TagCreateView>;

export const TagEditView = m.object({
	guild: GuildView,
	actor: UserView,

	oldTag: TagView,
	newTag: TagView,

	nameChanged: m.terminal(),
	contentChanged: m.terminal(),
	colorChanged: m.terminal(),
	attachmentsChanged: m.terminal(),
});
export type TagEditView = InferView<typeof TagDeleteView>;

export const TagDeleteView = m.object({
	guild: GuildView,
	actor: UserView,
	tag: TagView,
});
export type TagDeleteView = InferView<typeof TagDeleteView>;
