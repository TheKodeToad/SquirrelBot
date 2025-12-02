import { parseRoleUpdates } from "#common/discord/auditLogChanges.ts";
import {
	fetchMemberCached,
	fetchUserCached,
} from "#common/discord/cachedRequest.ts";
import { makeRoleView } from "#common/template/role.ts";
import { makeMemberUserView, makeUserView } from "#common/template/user.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { onBotEvent } from "#plugins/core/public/extensionPoints.ts";
import { logEvent } from "#plugins/logging/helper/logging.ts";
import {
	AuditLogActionTypes,
	AuditLogEntry,
	Guild,
	type Uncached,
} from "oceanic.js";

export default [
	onBotEvent({ type: "guildAuditLogEntryCreate", listener: handleAuditLog }),
];

async function handleAuditLog(
	ctx: SquirrelDiscordContext,
	guild: Guild | Uncached,
	entry: AuditLogEntry,
): Promise<void> {
	if (!(guild instanceof Guild)) {
		return;
	}

	switch (entry.actionType) {
		case AuditLogActionTypes.ROLE_CREATE:
			await handleCreate(ctx, guild, entry);
			return;
		case AuditLogActionTypes.ROLE_UPDATE:
			await handleUpdate(ctx, guild, entry);
			return;
		case AuditLogActionTypes.ROLE_DELETE:
			await handleDelete(ctx, guild, entry);
			return;
	}
}

async function handleCreate(
	ctx: SquirrelDiscordContext,
	guild: Guild | Uncached,
	entry: AuditLogEntry,
): Promise<void> {
	if (!(guild instanceof Guild)) {
		return;
	}

	if (entry.targetID === null || entry.userID === null) {
		return;
	}

	await logEvent(ctx, {
		guild,
		key: "roleCreate",
		async supply() {
			const changes = parseRoleUpdates(entry.changes ?? []);
			const actor = await fetchMemberCached(
				ctx.bot,
				guild,
				entry.userID!,
			);

			return {
				actor: makeMemberUserView(actor),
				role: makeRoleView({
					id: entry.targetID!,
					name: changes.name!.new!,
					color: changes.color?.new,
					hoist: changes.hoist?.new,
					mentionable: changes.mentionable?.new,
				}),
			};
		},
	});
}

async function handleUpdate(
	ctx: SquirrelDiscordContext,
	guild: Guild | Uncached,
	entry: AuditLogEntry,
): Promise<void> {
	if (!(guild instanceof Guild)) {
		return;
	}

	if (entry.targetID === null || entry.userID === null) {
		return;
	}

	await logEvent(ctx, {
		guild,
		key: "roleUpdate",
		async supply() {
			const changes = parseRoleUpdates(entry.changes ?? []);
			const name =
				changes.name?.new ?? guild.roles.get(entry.targetID!)?.name;

			if (name === undefined) {
				return null;
			}

			const actor = await fetchMemberCached(
				ctx.bot,
				guild,
				entry.userID!,
			);

			return {
				actor: makeMemberUserView(actor),
				nameChanged: changes.name?.new !== undefined,
				colorChanged: changes.color?.new !== undefined,
				hoistedChanged: changes.hoist?.new !== undefined,
				mentionableChanged: changes.mentionable?.new !== undefined,
				oldRole: makeRoleView({
					id: entry.targetID!,
					name: changes.name?.old,
					color: changes.color?.old,
					hoist: changes.hoist?.old,
					mentionable: changes.mentionable?.old,
				}),
				newRole: makeRoleView({
					id: entry.targetID!,
					name: changes.name!.new!,
					color: changes.color?.new,
					hoist: changes.hoist?.new,
					mentionable: changes.mentionable?.new,
				}),
			};
		},
	});
}

async function handleDelete(
	ctx: SquirrelDiscordContext,
	guild: Guild | Uncached,
	entry: AuditLogEntry,
): Promise<void> {
	if (!(guild instanceof Guild)) {
		return;
	}

	if (entry.targetID === null || entry.userID === null) {
		return;
	}

	await logEvent(ctx, {
		guild,
		key: "roleDelete",
		async supply() {
			const changes = parseRoleUpdates(entry.changes ?? []);
			const actor = await fetchUserCached(ctx.bot, entry.userID!);

			return {
				moderator: makeUserView(actor),
				role: makeRoleView({
					id: entry.targetID!,
					name: changes.name!.new!,
					color: changes.color?.new,
					hoist: changes.hoist?.new,
					mentionable: changes.mentionable?.new,
				}),
			};
		},
	});
}
