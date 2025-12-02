import {
	fetchMemberCached,
	fetchThreadCached,
} from "#common/discord/cachedRequest.ts";
import {
	debugFormatChannel,
	debugFormatGuildByID,
} from "#common/discord/debugFormatting.ts";
import {
	isTextableChannel,
	isThreadChannelType,
} from "#common/discord/general.ts";
import { canWriteInChannel } from "#common/discord/permissions.ts";
import { moduleLogger } from "#common/logger/logger.ts";
import {
	startPollingScheduler,
	type PollingSchedulerHandle,
} from "#common/pollingScheduler.ts";
import { dateToUnixSecs, SECOND } from "#common/time.ts";
import type { BackendDiscordContext } from "#discord/discord.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import { remindersConfigStore } from "#plugins/reminders/plugin.ts";
import {
	deleteReminder,
	getRemindersByFiresAt,
	type Reminder,
} from "#plugins/reminders/storage/reminders.ts";
import {
	Client,
	DiscordRESTError,
	MessageFlags,
	Permissions,
	type AnyTextableChannel,
} from "oceanic.js";

const logger = moduleLogger();
let scheduler: PollingSchedulerHandle<Reminder> | null = null;

export default [onBotInit(beginPollingReminders)];

function debugFormatReminder(bot: Client, reminder: Reminder): string {
	return `reminder #${reminder.number} in ${debugFormatGuildByID(bot, reminder.guildID)}`;
}

function getReminderKey(guildID: string, number: number): string {
	return guildID + "::" + number;
}

async function beginPollingReminders(
	ctx: BackendDiscordContext,
): Promise<void> {
	scheduler = await startPollingScheduler({
		discriminator: "reminders",
		pollRate: 60 * SECOND,

		poll: (start, end) => getRemindersByFiresAt(ctx.db, start, end),
		run: (reminder) => fire(ctx, reminder),

		getKey: (reminder) => getReminderKey(reminder.guildID, reminder.number),
		getTimestamp: (reminder) => reminder.firesAt,
		debugFormat: (reminder) => debugFormatReminder(ctx.bot, reminder),
	});
}

export function trackNewReminder(reminder: Reminder): void {
	scheduler?.track(reminder);
}

export function untrackReminder(guildID: string, number: number): void {
	scheduler?.untrack(getReminderKey(guildID, number));
}

async function fire(
	ctx: BackendDiscordContext,
	reminder: Reminder,
): Promise<void> {
	// delete it right away - don't remind the user awkwardly late!
	if (!(await deleteReminder(ctx.db, reminder.guildID, reminder.number))) {
		return;
	}

	if (!remindersConfigStore.has(reminder.guildID)) {
		return;
	}

	const guild = ctx.bot.guilds.get(reminder.guildID);

	// TODO: should these issues be reported to somebody
	// members could also be bulk requested ahead of time

	if (guild === undefined) {
		logger.debug?.(
			`Bot user is not in guild; not sending ${debugFormatReminder(ctx.bot, reminder)}`,
		);
		return; // no access to guild?
	}

	let channel: AnyTextableChannel;

	if (isThreadChannelType(reminder.channelType)) {
		try {
			var potentialThread = await fetchThreadCached(
				ctx.bot,
				guild,
				reminder.channelID,
			);
		} catch (error) {
			if (!(error instanceof DiscordRESTError)) {
				throw error;
			}

			logger.debug?.(
				`Thread was deleted; not sending ${debugFormatReminder(ctx.bot, reminder)}`,
			);
			return;
		}

		if (potentialThread === null) {
			throw new Error(
				"Inconsistent channel type - channel stopped being a thread?",
			);
		}

		channel = potentialThread;
	} else {
		const potentialChannel = guild.channels.get(reminder.channelID);

		if (potentialChannel === undefined) {
			logger.debug?.(
				`Channel was deleted; not sending ${debugFormatReminder(ctx.bot, reminder)}`,
			);
			return;
		}

		if (!isTextableChannel(potentialChannel)) {
			throw new Error(
				"Inconsistent channel type - channel stopped being textable?",
			);
		}

		channel = potentialChannel;
	}

	if (!canWriteInChannel(ctx.bot, channel, guild.clientMember)) {
		logger.debug?.(
			`Bot user cannot send messages in ${debugFormatChannel(channel)}; not sending ${debugFormatReminder(ctx.bot, reminder)}`,
		);
		return;
	}

	try {
		var reminderOwner = await fetchMemberCached(
			ctx.bot,
			guild,
			reminder.ownerID,
		);
	} catch (error) {
		if (!(error instanceof DiscordRESTError)) {
			throw error;
		}

		return;
	}

	// TODO: doesn't account for private thread but I don't think this really matters that much
	// don't allow perm bypass
	if (!canWriteInChannel(ctx.bot, channel, reminderOwner)) {
		logger.debug?.(
			`Owner cannot send messages in ${debugFormatChannel(channel)}; not sending ${debugFormatReminder(ctx.bot, reminder)}`,
		);
		return;
	}

	let content = `${icons.bell} **Reminder for <@${reminder.ownerID}> set at <t:${dateToUnixSecs(reminder.createdAt)}>!**`;

	if (Date.now() - reminder.firesAt.getTime() >= 10 * 60 * 1000) {
		content += `\n${icons.warning} Reminder running late! This is likely due to downtime.`;
	}

	if (reminder.message !== null) {
		content += "\n>>> " + reminder.message;
	}

	let flags = 0;

	if (reminder.silent) {
		flags |= MessageFlags.SUPPRESS_NOTIFICATIONS;
	}

	const reminderOwnerPerms = channel.permissionsOf(reminderOwner);

	if (!reminderOwnerPerms.has(Permissions.EMBED_LINKS)) {
		flags |= MessageFlags.SUPPRESS_EMBEDS;
	}

	await channel.createMessage({
		content,
		flags,
		allowedMentions: { users: [reminder.ownerID] },
	});
}
