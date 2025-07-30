import { parseRoleUpdates } from "#common/discord/auditLogChanges.ts";
import { fetchUserCached } from "#common/discord/cachedRequest.ts";
import { onBotEvent } from "#plugin/core/public/extensionPoints.ts";
import { logWithLogger } from "#plugin/logging/helper/webhooks.ts";
import { loggingConfigStore } from "#plugin/logging/index.ts";
import { AuditLogActionTypes, AuditLogEntry, Guild, User, type Uncached } from "oceanic.js";

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

	if (entry.targetID === null)
		return;

	const config = loggingConfigStore.get(guild.id);

	if (config === undefined)
		return;

	if (entry.userID === null)
		return;

	let user: User | undefined;

	const changes = parseRoleUpdates(entry.changes ?? []);

	for (const logger of config.loggers) {
		const { role_create } = logger.events;

		if (!role_create)
			continue;

		user ??= await fetchUserCached(entry.userID);

		await logWithLogger(logger, guild, role_create.message({
			user,
			user_avatar: user.avatarURL(),
			role: { id: entry.targetID, name: changes.name!.new! },
			color: colorToString(changes.color?.new ?? 0),
			hoisted: (changes.hoist?.new ?? false).toString(),
			mentionable: (changes.mentionable?.new ?? false).toString(),
		}));
	}
}

async function handleUpdate(guild: Guild | Uncached, entry: AuditLogEntry): Promise<void> {
	if (!(guild instanceof Guild))
		return;

	if (entry.targetID === null)
		return;

	const config = loggingConfigStore.get(guild.id);

	if (config === undefined)
		return;

	if (entry.userID === null)
		return;

	let user: User | undefined;

	const changes = parseRoleUpdates(entry.changes ?? []);
	const name = changes.name?.new ?? guild.roles.get(entry.targetID)?.name;

	if (name === undefined)
		return;

	for (const logger of config.loggers) {
		const { role_update } = logger.events;

		if (!role_update)
			continue;

		user ??= await fetchUserCached(entry.userID);

		await logWithLogger(logger, guild, role_update.message({
			user,
			user_avatar: user.avatarURL(),
			role: { id: entry.targetID, name },
			old_name: changes.name?.old,
			old_color: colorToString(changes.color?.old),
			old_hoisted: changes.hoist?.old?.toString(),
			old_mentionable: changes.mentionable?.old?.toString(),
			new_name: changes.name?.new,
			new_color: colorToString(changes.color?.new),
			new_hoisted: changes.hoist?.new?.toString(),
			new_mentionable: changes.mentionable?.new?.toString(),
		}));
	}
}

async function handleDelete(guild: Guild | Uncached, entry: AuditLogEntry): Promise<void> {
	if (!(guild instanceof Guild))
		return;

	if (entry.targetID === null)
		return;

	const config = loggingConfigStore.get(guild.id);

	if (config === undefined)
		return;

	if (entry.userID === null)
		return;

	let user: User | undefined;

	const changes = parseRoleUpdates(entry.changes ?? []);

	for (const logger of config.loggers) {
		const { role_delete } = logger.events;

		if (!role_delete)
			continue;

		user ??= await fetchUserCached(entry.userID);

		await logWithLogger(logger, guild, role_delete.message({
			user,
			user_avatar: user.avatarURL(),
			role: { id: entry.targetID, name: changes.name!.old! },
			color: colorToString(changes.color?.old),
			hoisted: changes.hoist?.old?.toString(),
			mentionable: changes.mentionable?.old?.toString(),
		}));
	}
}
