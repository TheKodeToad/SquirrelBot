import { cancelGuildInfoDeletion, getAllGuildInfo, insertGuildInfo, markGuildAllowed, markGuildNotAllowed, markUnknownGuildAllowed, scheduleGuildInfoDeletion, updateGuildInfo } from "../../../db/core/guildInfo.ts";
import { BOT_ALLOWED_GUILDS } from "../../../environment.ts";
import { bot } from "../../index.ts";
import { defineEventListener } from "./public/eventListener.ts";

type Listener = (guildID: string) => unknown;

const allowedGuilds: Set<string> = new Set;
const grantListeners: Listener[] = [];
const revokeListeners: Listener[] = [];

export async function initGuildInfo(): Promise<void> {
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

export function addGrantAccessListener(listener: Listener): void {
	grantListeners.push(listener);
}

export function addRevokeAccessListener(listener: Listener): void {
	revokeListeners.push(listener);
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
		for (const listeners of grantListeners)
			listeners(id);

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

		for (const listener of revokeListeners)
			listener(id);

		return date ?? false;
	}
}

export const guildInfoSyncGuildCreateHandler = defineEventListener("guildCreate", async guild => {
	if (isGuildAllowed(guild.id))
		await updateGuildInfo(guild.id, guild.name, guild.icon, guild.ownerID);
});

export const guildInfoSyncGuildUpdateHandler = defineEventListener("guildUpdate", async (guild, oldGuild) => {
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
});

