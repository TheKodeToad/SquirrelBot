import {
	debugFormatGuild,
	debugFormatGuildByID,
} from "#common/discord/debugFormatting.ts";
import { moduleLogger } from "#common/logger/logger.ts";
import {
	startPollingScheduler,
	type PollingSchedulerHandle,
} from "#common/pollingScheduler.ts";
import { SECOND } from "#common/time.ts";
import type { BackendDiscordContext } from "#discord/discord.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import {
	tempBanTable,
	type TempBan,
} from "#plugins/moderation/storage/tempBans.ts";
import { Client, Constants, DiscordRESTError } from "oceanic.js";

const logger = moduleLogger();
let scheduler: PollingSchedulerHandle<TempBan> | null = null;

export default [onBotInit(beginPollingTempBans)];

function debugFormatTempBan(bot: Client, tempBan: TempBan): string {
	return `temp ban for @${tempBan.targetID} in ${debugFormatGuildByID(bot, tempBan.guildID)}`;
}

function getTempBanKey(guildID: string, targetID: string): string {
	return guildID + "::" + targetID;
}

async function beginPollingTempBans(ctx: BackendDiscordContext): Promise<void> {
	scheduler = await startPollingScheduler({
		discriminator: "moderationTempBans",
		pollRate: 60 * SECOND,

		poll: (start, end) => tempBanTable.allEndingBetween(ctx.db, start, end),
		run: (ban) => trigger(ctx, ban),

		getKey: (ban) => getTempBanKey(ban.guildID, ban.targetID),
		getTimestamp: (ban) => ban.endsAt,
		debugFormat: (ban) => debugFormatTempBan(ctx.bot, ban),
	});
}

export function trackNewTempBan(tempBan: TempBan): void {
	scheduler?.track(tempBan);
}

export function untrackTempBan(guildID: string, targetID: string): void {
	scheduler?.untrack(getTempBanKey(guildID, targetID));
}

async function trigger(
	ctx: BackendDiscordContext,
	ban: TempBan,
): Promise<void> {
	const guild = ctx.bot.guilds.get(ban.guildID);

	if (guild === undefined) {
		logger.debug?.(
			`Bot user is not in guild; not triggering ${debugFormatTempBan(ctx.bot, ban)}`,
		);
		return;
	}

	try {
		logger.debug?.(
			`Lifting expired ban of ${ban.targetID} in ${debugFormatGuild(guild)}`,
		);
		await guild.removeBan(ban.targetID, "Ban expired");
	} catch (error) {
		if (!(error instanceof DiscordRESTError)) {
			throw error;
		}

		if (error.code !== Constants.JSONErrorCodes.UNKNOWN_BAN) {
			logger.debug?.(
				`Failed to lift expired ban of ${ban.targetID} in ${debugFormatGuild(guild)}`,
			);
		}
	} finally {
		// TODO: does this always run, even if the catch throws
		await tempBanTable.remove(ctx.db, ban.guildID, ban.targetID);
	}
}
