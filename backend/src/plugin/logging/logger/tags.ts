import { makeGuildView } from "#common/template/guild.ts";
import { makeMemberUserView } from "#common/template/user.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { logEvent } from "#plugin/logging/helper/logging.ts";
import {
	onTagCreated,
	onTagDeleted,
	onTagEdited,
} from "#plugin/tags/public/extensionPoints.ts";
import type { Tag } from "#plugin/tags/public/tag.ts";
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
	await logEvent(ctx, guild, null, "tag_create", () => {
		return {
			guild: makeGuildView(guild),
			actor: makeMemberUserView(actor),
			tag,
		};
	});
}

async function handleEdit(
	ctx: SquirrelDiscordContext,
	guild: Guild,
	actor: Member,
	oldTag: Tag,
	newTag: Tag,
): Promise<void> {
	const nameChanged = oldTag.name !== newTag.name;
	const contentChanged = oldTag.content !== newTag.content;

	if (!(nameChanged || contentChanged)) {
		return;
	}

	await logEvent(ctx, guild, null, "tag_edit", () => {
		return {
			guild: makeGuildView(guild),
			actor: makeMemberUserView(actor),
			old_tag: oldTag,
			new_tag: newTag,
			name_changed: nameChanged,
			content_changed: contentChanged,
		};
	});
}

async function handleDelete(
	ctx: SquirrelDiscordContext,
	guild: Guild,
	actor: Member,
	tag: Tag,
): Promise<void> {
	await logEvent(ctx, guild, null, "tag_delete", () => {
		return {
			guild: makeGuildView(guild),
			actor: makeMemberUserView(actor),
			tag,
		};
	});
}
