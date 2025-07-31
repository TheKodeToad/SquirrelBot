import { parseRoleUpdates } from "#common/discord/auditLogChanges.ts";
import { fetchUserCached } from "#common/discord/cachedRequest.ts";
import { onBotEvent } from "#plugin/core/public/extensionPoints.ts";
import { logEvent } from "#plugin/logging/helper/logging.ts";
import { AuditLogActionTypes, AuditLogEntry, Guild, type Uncached } from "oceanic.js";

export default [
	onBotEvent({ type: "guildAuditLogEntryCreate", listener: handleAuditLog }),
];

async function handleAuditLog(guild: Guild | Uncached, entry: AuditLogEntry): Promise<void> {
	if (!(guild instanceof Guild))
		return;

	switch (entry.actionType) {
	case AuditLogActionTypes.ROLE_CREATE:
		await handleCreate(guild, entry);
		return;
	case AuditLogActionTypes.ROLE_UPDATE:
		await handleUpdate(guild, entry);
		return;
	case AuditLogActionTypes.ROLE_DELETE:
		await handleDelete(guild, entry);
		return;
	}
}

function colorToString(color?: number): string | undefined {
	if (color === undefined)
		return undefined;

	return "#" + color.toString(16).padStart(6, "0");
}

async function handleCreate(guild: Guild | Uncached, entry: AuditLogEntry): Promise<void> {
	if (!(guild instanceof Guild))
		return;

	if (entry.targetID === null || entry.userID === null)
		return;

	await logEvent(
		guild,
		null,
		events => events.role_create,
		async () => {
			const changes = parseRoleUpdates(entry.changes ?? []);
			const user = await fetchUserCached(entry.userID!);

			return {
				user,
				user_avatar: user.avatarURL(),
				role: { id: entry.targetID!, name: changes.name!.new! },
				color: colorToString(changes.color?.new ?? 0),
				hoisted: (changes.hoist?.new ?? false).toString(),
				mentionable: (changes.mentionable?.new ?? false).toString(),
			};
		});
}

async function handleUpdate(guild: Guild | Uncached, entry: AuditLogEntry): Promise<void> {
	if (!(guild instanceof Guild))
		return;

	if (entry.targetID === null || entry.userID === null)
		return;

	await logEvent(
		guild,
		null,
		events => events.role_update,
		async () => {
			const changes = parseRoleUpdates(entry.changes ?? []);
			const name = changes.name?.new ?? guild.roles.get(entry.targetID!)?.name;

			if (name === undefined)
				return null;


			const user = await fetchUserCached(entry.userID!);

			return {
				user,
				user_avatar: user.avatarURL(),
				role: { id: entry.targetID!, name },
				old_name: changes.name?.old,
				old_color: colorToString(changes.color?.old),
				old_hoisted: changes.hoist?.old?.toString(),
				old_mentionable: changes.mentionable?.old?.toString(),
				new_name: changes.name?.new,
				new_color: colorToString(changes.color?.new),
				new_hoisted: changes.hoist?.new?.toString(),
				new_mentionable: changes.mentionable?.new?.toString(),
			};
		}
	);
}

async function handleDelete(guild: Guild | Uncached, entry: AuditLogEntry): Promise<void> {
	if (!(guild instanceof Guild))
		return;

	if (entry.targetID === null || entry.userID === null)
		return;

	await logEvent(
		guild,
		null,
		events => events.role_delete,
		async () => {
			const changes = parseRoleUpdates(entry.changes ?? []);
			const user = await fetchUserCached(entry.userID!);

			return {
				user,
				user_avatar: user.avatarURL(),
				role: { id: entry.targetID!, name: changes.name!.old! },
				color: colorToString(changes.color?.old),
				hoisted: changes.hoist?.old?.toString(),
				mentionable: changes.mentionable?.old?.toString(),
			};
		}
	);
}
