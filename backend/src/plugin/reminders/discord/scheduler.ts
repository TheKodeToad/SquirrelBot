import { fetchMemberCached, fetchThreadCached } from "#common/discord/cachedRequest.ts";
import { debugFormatChannel } from "#common/discord/debugFormat.ts";
import { isTextableChannel, isThreadChannelType } from "#common/discord/general.ts";
import { canWriteInChannel } from "#common/discord/permissions.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { dateToHMSString, dateToUnixSeconds } from "#common/time.ts";
import { bot } from "#discord/index.ts";
import { icons } from "#plugin/core/public/discord/icons.ts";
import { debugFormatReminder, remindersConfigStore } from "#plugin/reminders/index.ts";
import { deleteReminder, getRemindersByFiresAt, type Reminder } from "#plugin/reminders/storage/reminders.ts";
import { DiscordRESTError, MessageFlags, Permissions, type AnyTextableChannel } from "oceanic.js";

const logger = moduleLogger();

const TIMEOUT_POLL_RATE = 60 * 1000;

let nextExpiryStartTime = new Date(0);

export async function beginPollingReminders(): Promise<void> {
	await poll();
	setInterval(poll, TIMEOUT_POLL_RATE).unref();
}

export function trackNewReminder(reminder: Reminder): void {
	if (reminder.firesAt.getTime() >= nextExpiryStartTime.getTime())
		return;

	setTimeout(() => fire(reminder), Math.max(0, reminder.firesAt.getTime() - Date.now())).unref();
}

async function poll(): Promise<void> {
	const end = new Date(Date.now() + TIMEOUT_POLL_RATE);

	logger.debug?.(
		nextExpiryStartTime.getTime() === 0
			? "Setting initial timeouts for missed and upcoming reminders until " + dateToHMSString(end)
			: "Setting timeouts for reminders from " + dateToHMSString(nextExpiryStartTime) + " to " + dateToHMSString(end)
	);

	const reminders = await getRemindersByFiresAt(nextExpiryStartTime, end);
	nextExpiryStartTime = end;

	for (const reminder of reminders)
		setFireTimeout(reminder);
}

function setFireTimeout(reminder: Reminder): void {
	const delay = Math.max(0, reminder.firesAt.getTime() - Date.now());
	setTimeout(() => fire(reminder), delay);

	logger.debug?.(`Setting up timeout for reminder ${debugFormatReminder(reminder)} with delay ${delay}`);
}

async function fire(reminder: Reminder): Promise<void> {
	// delete it right away - don't remind the user awkwardly late!
	if (!await deleteReminder(reminder.guildID, reminder.number))
		return;

	if (!remindersConfigStore.has(reminder.guildID))
		return;

	const guild = bot.guilds.get(reminder.guildID);

	// TODO: should these issues be reported to somebody
	// members could also be bulk requested ahead of time

	if (guild === undefined) {
		logger.debug?.(`Bot user is not in guild; not sending reminder ${debugFormatReminder(reminder)}`);
		return; // no access to guild?
	}

	let channel: AnyTextableChannel;

	if (isThreadChannelType(reminder.channelType)) {
		try {
			var potentialThread = await fetchThreadCached(guild, reminder.channelID);
		} catch (error) {
			if (!(error instanceof DiscordRESTError))
				throw error;

			logger.debug?.(`Thread was deleted; not sending reminder ${debugFormatReminder(reminder)}`);
			return;
		}

		if (potentialThread === null)
			throw new Error("Inconsistent channel type - channel stopped being a thread?");

		channel = potentialThread;
	} else {
		const potentialChannel = guild.channels.get(reminder.channelID);

		if (potentialChannel === undefined) {
			logger.debug?.(`Channel was deleted; not sending reminder ${debugFormatReminder(reminder)}`);
			return;
		}

		if (!isTextableChannel(potentialChannel))
			throw new Error("Inconsistent channel type - channel stopped being textable?");

		channel = potentialChannel;
	}

	if (!canWriteInChannel(channel, guild.clientMember)) {
		logger.debug?.(`Bot user cannot send messages in ${debugFormatChannel(channel)}; not sending reminder ${debugFormatReminder(reminder)}`);
		return;
	}

	try {
		var reminderOwner = await fetchMemberCached(guild, reminder.ownerID);
	} catch (error) {
		if (!(error instanceof DiscordRESTError))
			throw error;

		return;
	}

	// TODO: doesn't account for private thread but I don't think this really matters that much
	// don't allow perm bypass
	if (!canWriteInChannel(channel, reminderOwner)) {
		logger.debug?.(`Owner cannot send messages in ${debugFormatChannel(channel)}; not sending reminder ${debugFormatReminder(reminder)}`);
		return;
	}

	let content = `${icons.bell} **Reminder for <@${reminder.ownerID}> set at <t:${dateToUnixSeconds(reminder.createdAt)}>!**`;

	if ((Date.now() - reminder.firesAt.getTime()) >= 10 * 60 * 1000)
		content += `\n${icons.warning} Reminder running late! This is likely due to downtime.`;

	if (reminder.message !== null)
		content += "\n>>> " + reminder.message;

	let flags = 0;

	if (reminder.silent)
		flags |= MessageFlags.SUPPRESS_NOTIFICATIONS;

	const reminderOwnerPerms = channel.permissionsOf(reminderOwner);

	if (!reminderOwnerPerms.has(Permissions.EMBED_LINKS))
		flags |= MessageFlags.SUPPRESS_EMBEDS;

	await channel.createMessage({
		content,
		flags,
		allowedMentions: { users: [reminder.ownerID] }
	});
}
