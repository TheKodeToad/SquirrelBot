import { moduleLogger } from "#common/logger/logger.ts";
import { HOUR } from "#common/time.ts";
import type { BackendDiscordContext } from "#discord/discord.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import { BOT_ALLOWED_GUILDS } from "#environment.ts";
import {
	EventListenerPhase,
	makeEventExtensionPoint,
} from "#extensionPoint.ts";
import { onBotEvent } from "#plugins/core/public/extensionPoints.ts";
import {
	cancelGuildInfoDeletion,
	deleteExpiredGuildInfo,
	getAllGuildInfo,
	insertGuildInfo,
	markGuildAllowed,
	markGuildNotAllowed,
	markUnknownGuildAllowed,
	scheduleGuildInfoDeletion,
	updateGuildInfo,
} from "#plugins/core/storage/guildInfo.ts";
import type { Guild, JSONGuild } from "oceanic.js";
import type { Pool } from "pg";

const logger = moduleLogger();

const allowedGuilds: Set<string> = new Set();

export type GuildAccessListener = (guildID: string) => void;
export const onGuildAccessGranted =
	makeEventExtensionPoint<[ctx: BackendDiscordContext, id: string]>();
export const onGuildAccessRevoked =
	makeEventExtensionPoint<[ctx: BackendDiscordContext, id: string]>();
export const onGuildInfoReady =
	makeEventExtensionPoint<[ctx: BackendDiscordContext]>();

export default [
	onBotInit(init, EventListenerPhase.Pre),
	onBotEvent({
		type: "guildCreate",
		listener: (ctx, guild) => handleCreate(ctx.db, guild),
	}),
	onBotEvent({
		type: "guildUpdate",
		listener: (ctx, guild, oldGuild) =>
			handleUpdate(ctx.db, guild, oldGuild),
	}),
];

async function init(ctx: BackendDiscordContext): Promise<void> {
	logger.debug?.("Initializing guild info");

	const guildsInfo = await getAllGuildInfo(ctx.db);
	// guilds from env var, remove those which are already present
	const missing = [...BOT_ALLOWED_GUILDS];

	for (const guildInfo of guildsInfo) {
		const missingIndex = missing.indexOf(guildInfo.id);

		if (missingIndex !== -1) {
			missing.splice(missingIndex, 1);

			if (guildInfo.deleteAt !== null) {
				await cancelGuildInfoDeletion(ctx.db, guildInfo.id);
			}
		} else if (!guildInfo.allowed) {
			// was removed from env var
			if (guildInfo.deleteAt === null) {
				await scheduleGuildInfoDeletion(ctx.db, guildInfo.id);
			}

			continue;
		}

		if (guildInfo.allowed) {
			allowedGuilds.add(guildInfo.id);
		}

		const realGuild = ctx.bot.guilds.get(guildInfo.id);

		if (realGuild === undefined) {
			continue;
		}

		if (
			guildInfo.name === realGuild.name &&
			guildInfo.iconHash === realGuild.icon &&
			guildInfo.ownerID === realGuild.ownerID
		) {
			continue;
		}

		await updateGuildInfo(
			ctx.db,
			guildInfo.id,
			realGuild.name,
			realGuild.icon,
			realGuild.ownerID,
		);
	}

	for (const missingGuildID of missing) {
		const realGuild = ctx.bot.guilds.get(missingGuildID);

		await insertGuildInfo(
			ctx.db,
			missingGuildID,
			realGuild?.name ?? null,
			realGuild?.icon ?? null,
			realGuild?.ownerID ?? null,
			false,
		);
	}

	// we do await these as we do want errors to interrupt startup
	await onGuildInfoReady.fire(ctx);

	await beginDeleteGuildInfoLoop(ctx.db);
}

export async function beginDeleteGuildInfoLoop(db: Pool): Promise<void> {
	try {
		logger.debug?.("Deleting expired guild info");

		const deletedCount = await deleteExpiredGuildInfo(db);

		logger.debug?.(`Deleted ${deletedCount} guilds`);
	} finally {
		setTimeout(() => beginDeleteGuildInfoLoop(db), 6 * HOUR).unref();
	}
}

async function handleCreate(db: Pool, guild: Guild): Promise<void> {
	if (isGuildAllowed(guild.id)) {
		await updateGuildInfo(
			db,
			guild.id,
			guild.name,
			guild.icon,
			guild.ownerID,
		);
	}
}

async function handleUpdate(
	db: Pool,
	guild: Guild,
	oldGuild: JSONGuild | null,
): Promise<void> {
	if (oldGuild === null) {
		return;
	}

	if (!isGuildAllowed(guild.id)) {
		return;
	}

	if (
		oldGuild.name === guild.name &&
		oldGuild.icon === guild.icon &&
		oldGuild.ownerID === guild.ownerID
	) {
		return;
	}

	await updateGuildInfo(db, guild.id, guild.name, guild.icon, guild.ownerID);
}

export function isGuildAllowed(id: string): boolean {
	return allowedGuilds.has(id) || BOT_ALLOWED_GUILDS.includes(id);
}

export function* getAllowedGuilds(): Generator<string> {
	for (const id of BOT_ALLOWED_GUILDS) {
		if (!allowedGuilds.has(id)) {
			yield id;
		}
	}

	for (const id of allowedGuilds) {
		yield id;
	}
}

export async function grantAccess(
	ctx: BackendDiscordContext,
	id: string,
): Promise<boolean> {
	if (allowedGuilds.has(id)) {
		return false;
	}

	const realGuild = ctx.bot.guilds.get(id);

	if (realGuild !== undefined) {
		await markGuildAllowed(
			ctx.db,
			id,
			realGuild?.name ?? null,
			realGuild?.icon ?? null,
			realGuild?.ownerID ?? null,
		);
	} else {
		await markUnknownGuildAllowed(ctx.db, id);
	}

	allowedGuilds.add(id);

	if (!BOT_ALLOWED_GUILDS.includes(id)) {
		await onGuildAccessGranted.fire(ctx, id);
	}

	return true;
}

export async function revokeAccess(
	ctx: BackendDiscordContext,
	id: string,
): Promise<false | true | Date> {
	if (!allowedGuilds.has(id)) {
		return false;
	}

	if (BOT_ALLOWED_GUILDS.includes(id)) {
		await markGuildNotAllowed(ctx.db, id);
		allowedGuilds.delete(id);
		return true;
	} else {
		const date = await scheduleGuildInfoDeletion(ctx.db, id);
		allowedGuilds.delete(id);

		await onGuildAccessRevoked.fire(ctx, id);

		return date ?? false;
	}
}
