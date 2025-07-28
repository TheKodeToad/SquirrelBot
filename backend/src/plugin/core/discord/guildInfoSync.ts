import { moduleLogger } from "#common/logger/index.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import { bot } from "#discord/index.ts";
import { BOT_ALLOWED_GUILDS } from "#environment.ts";
import { EventListenerPhase, makeEventExtensionPoint } from "#loader/extensionPoint.ts";
import { onBotEvent } from "#plugin/core/discord/public/extensionPoints.ts";
import { cancelGuildInfoDeletion, getAllGuildInfo, insertGuildInfo, markGuildAllowed, markGuildNotAllowed, markUnknownGuildAllowed, scheduleGuildInfoDeletion, updateGuildInfo } from "#plugin/core/storage/guildInfo.ts";
import type { Guild, JSONGuild } from "oceanic.js";

const logger = moduleLogger();

const allowedGuilds: Set<string> = new Set;

export type GuildAccessListener = (guildID: string) => void;
export const onGuildAccessGranted = makeEventExtensionPoint<string>();
export const onGuildAccessRevoked = makeEventExtensionPoint<string>();
export const onGuildInfoReady = makeEventExtensionPoint<void>();

export default [
	onBotInit(init, EventListenerPhase.Pre),
	onBotEvent({ type: "guildCreate", listener: handleCreate }),
	onBotEvent({ type: "guildUpdate", listener: handleUpdate }),
];

async function init(): Promise<void> {
	logger.debug?.("Initializing guild info");

	const guildsInfo = await getAllGuildInfo();
	// guilds from env var, remove those which are already present
	const missing = [...BOT_ALLOWED_GUILDS];

	for (const guildInfo of guildsInfo) {
		const missingIndex = missing.indexOf(guildInfo.id);

		if (missingIndex !== -1) {
			missing.splice(missingIndex, 1);

			if (guildInfo.deleteAt !== null)
				await cancelGuildInfoDeletion(guildInfo.id);
		} else if (!guildInfo.allowed) {
			// was removed from env var
			if (guildInfo.deleteAt === null)
				await scheduleGuildInfoDeletion(guildInfo.id);

			continue;
		}

		if (guildInfo.allowed)
			allowedGuilds.add(guildInfo.id);

		const realGuild = bot.guilds.get(guildInfo.id);

		if (realGuild === undefined)
			continue;

		if (guildInfo.name === realGuild.name
			&& guildInfo.iconHash === realGuild.icon
			&& guildInfo.ownerID === realGuild.ownerID) {
			continue;
		}

		await updateGuildInfo(guildInfo.id, realGuild.name, realGuild.icon, realGuild.ownerID);
	}

	for (const missingGuildID of missing) {
		const realGuild = bot.guilds.get(missingGuildID);

		await insertGuildInfo(
			missingGuildID,
			realGuild?.name ?? null,
			realGuild?.icon ?? null,
			realGuild?.ownerID ?? null,
			false,
		);
	}

	// we do await these as we do want errors to interrupt startup
	await onGuildInfoReady.fire();
}

async function handleCreate(guild: Guild): Promise<void> {
	if (isGuildAllowed(guild.id))
		await updateGuildInfo(guild.id, guild.name, guild.icon, guild.ownerID);
}

async function handleUpdate(guild: Guild, oldGuild: JSONGuild | null): Promise<void> {
	if (oldGuild === null)
		return;

	if (!isGuildAllowed(guild.id))
		return;

	if (oldGuild.name === guild.name
		&& oldGuild.icon === guild.icon
		&& oldGuild.ownerID === guild.ownerID) {
		return;
	}

	await updateGuildInfo(guild.id, guild.name, guild.icon, guild.ownerID);
}


export function isGuildAllowed(id: string): boolean {
	return allowedGuilds.has(id) || BOT_ALLOWED_GUILDS.includes(id);
}

export function* getAllowedGuilds(): Generator<string> {
	for (const id of BOT_ALLOWED_GUILDS)
		if (!allowedGuilds.has(id))
			yield id;

	for (const id of allowedGuilds)
		yield id;
}

export async function grantAccess(id: string): Promise<boolean> {
	if (allowedGuilds.has(id))
		return false;

	const realGuild = bot.guilds.get(id);

	if (realGuild !== undefined) {
		await markGuildAllowed(
			id,
			realGuild?.name ?? null,
			realGuild?.icon ?? null,
			realGuild?.ownerID ?? null,
		);
	} else
		await markUnknownGuildAllowed(id);

	allowedGuilds.add(id);

	if (!BOT_ALLOWED_GUILDS.includes(id))
		await onGuildAccessGranted.fire(id);

	return true;
}

export async function revokeAccess(id: string): Promise<false | true | Date> {
	if (!allowedGuilds.has(id))
		return false;

	if (BOT_ALLOWED_GUILDS.includes(id)) {
		await markGuildNotAllowed(id);
		allowedGuilds.delete(id);
		return true;
	} else {
		const date = await scheduleGuildInfoDeletion(id);
		allowedGuilds.delete(id);

		await onGuildAccessRevoked.fire(id);

		return date ?? false;
	}
}

