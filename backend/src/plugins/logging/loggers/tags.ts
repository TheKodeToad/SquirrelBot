import type { Nullable } from "#common/general.ts";
import { makeGuildView } from "#common/views/guild.ts";
import { makeMemberUserView } from "#common/views/user.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { makeTagView } from "#plugins/logging/config/tags.ts";
import { logEvent } from "#plugins/logging/helper/logging.ts";
import {
	onTagCreated,
	onTagDeleted,
	onTagEdited,
} from "#plugins/tags/public/extensionPoints.ts";
import type { Tag } from "#plugins/tags/public/tag.ts";
import type { Guild, Member } from "oceanic.js";

export default [
	onTagCreated(handleCreate),
	onTagEdited(handleEdit),
	onTagDeleted(handleDelete),
];

async function handleCreate(
	ctx: SquirrelDiscordContext,
	guild: Guild,
	actor: Member,
	tag: Tag,
): Promise<void> {
	await logEvent(ctx, {
		guild,
		key: "tagCreate",
		supply() {
			return {
				guild: makeGuildView(guild),
				actor: makeMemberUserView(actor),
				tag: makeTagView(tag),
			};
		},
	});
}

async function handleEdit(
	ctx: SquirrelDiscordContext,
	guild: Guild,
	actor: Member,
	oldTag: Tag,
	changes: Nullable<Tag>,
): Promise<void> {
	await logEvent(ctx, {
		guild,
		key: "tagEdit",
		supply() {
			return {
				guild: makeGuildView(guild),
				actor: makeMemberUserView(actor),
				oldTag: makeTagView(oldTag),
				newTag: makeTagView({
					name: changes.name ?? oldTag.name,
					content: changes.content ?? oldTag.content,
					color: changes.color ?? oldTag.color,
					attachments: changes.attachments ?? oldTag.attachments,
				}),
				nameChanged: changes.name !== null,
				contentChanged: changes.content !== null,
				colorChanged: changes.color !== null,
				attachmentsChanged: changes.attachments !== null,
			};
		},
	});
}

async function handleDelete(
	ctx: SquirrelDiscordContext,
	guild: Guild,
	actor: Member,
	tag: Tag,
): Promise<void> {
	await logEvent(ctx, {
		guild,
		key: "tagDelete",
		supply() {
			return {
				guild: makeGuildView(guild),
				actor: makeMemberUserView(actor),
				tag: makeTagView(tag),
			};
		},
	});
}
