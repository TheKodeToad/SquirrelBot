import type { Nullable } from "#common/general.ts";
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
	await logEvent(ctx, {
		guild,
		key: "tagCreate",
		supply() {
			return {
				guild: makeGuildView(guild),
				actor: makeMemberUserView(actor),
				tag,
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
				oldTag: oldTag,
				newTag: {
					name: changes.name ?? oldTag.name,
					content: changes.content ?? oldTag.content,
				},
				nameChanged: changes.name !== null,
				contentChanged: changes.content !== null,
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
				tag,
			};
		},
	});
}
