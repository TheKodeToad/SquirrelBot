import { debugFormatGuild, debugFormatGuildByID } from "#common/discord/debugFormat.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { startPollingScheduler, type PollingSchedulerHandle } from "#common/pollingScheduler.ts";
import { SECOND } from "#common/time.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import { bot } from "#discord/index.ts";
import { deleteTempBan, getTempBansByEndsAt, type TempBan } from "#plugin/moderation/storage/tempBans.ts";
import { Constants, DiscordRESTError } from "oceanic.js";

const logger = moduleLogger();
let scheduler: PollingSchedulerHandle<TempBan> | null = null;

export default [onBotInit(beginPollingTempBans)];

function debugFormatTempBan(tempBan: TempBan) {
	return `temp ban for @${tempBan.targetID} in ${debugFormatGuildByID(tempBan.guildID)}`;
}

function getTempBanKey(guildID: string, targetID: string): string {
	return guildID + "::" + targetID;
}

async function beginPollingTempBans(): Promise<void> {
	scheduler = await startPollingScheduler({
		discriminator: "moderationTempBans",
		pollRate: 60 * SECOND,

		poll: (start, end) => getTempBansByEndsAt(start, end),
		run: trigger,

		getKey: tempBan => getTempBanKey(tempBan.guildID, tempBan.targetID),
		getTimestamp: tempBan => tempBan.endsAt,
		debugFormat: debugFormatTempBan,
	})
}

export function trackNewTempBan(tempBan: TempBan): void {
	scheduler?.track(tempBan);
}

export function untrackTempBan(guildID: string, targetID: string) {
	scheduler?.untrack(getTempBanKey(guildID, targetID));
}

async function trigger(ban: TempBan): Promise<void> {
	const guild = bot.guilds.get(ban.guildID);

	if (guild === undefined) {
		logger.debug?.(`Bot user is not in guild; not triggering ${debugFormatTempBan(ban)}`);
		return;
	}

	try {
		logger.debug?.(`Lifting expired ban of ${ban.targetID} in ${debugFormatGuild(guild)}`)
		guild.removeBan(ban.targetID, "Ban expired");
	} catch (error) {
		if (!(error instanceof DiscordRESTError))
			throw error;

		if (error.code !== Constants.JSONErrorCodes.UNKNOWN_BAN)
			logger.debug?.(`Failed to lift expired ban of ${ban.targetID} in ${debugFormatGuild(guild)}`);
	} finally {
		// TODO: does this always run, even if the catch throws
		await deleteTempBan(ban.guildID, ban.targetID);
	}
}
