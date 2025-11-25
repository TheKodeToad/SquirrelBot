import type { SquirrelDiscordContext } from "#discord/index.ts";
import { makeEventExtensionPoint } from "#extensionPoint.ts";
import type { Tag } from "#plugin/tags/public/tag.ts";
import type { Guild, Member } from "oceanic.js";

type UnaryEvent = [
	ctx: SquirrelDiscordContext,
	guild: Guild,
	actor: Member,
	tag: Tag,
];
type BinaryEvent = [
	ctx: SquirrelDiscordContext,
	guild: Guild,
	actor: Member,
	oldTag: Tag,
	newTag: Tag,
];

export const onTagCreated = makeEventExtensionPoint<UnaryEvent>();
export const onTagEdited = makeEventExtensionPoint<BinaryEvent>();
export const onTagDeleted = makeEventExtensionPoint<UnaryEvent>();
