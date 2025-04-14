import { DiscordRESTError, MessageFlags, Permissions, TextableChannel } from "oceanic.js";
import { formatDateHMS } from "../../../common/format.ts";
import { moduleLogger } from "../../../common/logger/index.ts";
import { deleteReminder, getRemindersByFiresAt, type Reminder } from "../../../db/reminders/reminder.ts";
import { getMemberCached } from "../../common/discord/cache.ts";
import { debugFormatGuildByID } from "../../common/discord/debugFormat.ts";
import { canWriteInChannel } from "../../common/discord/permissions.ts";
import { bot } from "../../index.ts";
import { icons } from "../core/public/icons.ts";

const logger = moduleLogger();

const TIMEOUT_POLL_RATE = 60 * 1000;

let nextExpiryStartTime = new Date(0);

export function beginPollingReminders() {
	poll();
	setInterval(poll, TIMEOUT_POLL_RATE).unref();
}

export function trackNewReminder(reminder: Reminder) {
	if (reminder.firesAt.getTime() >= nextExpiryStartTime.getTime())
		return;

	setTimeout(() => fire(reminder), Math.max(0, reminder.firesAt.getTime() - Date.now()));
}

async function poll() {
	const end = new Date(Date.now() + TIMEOUT_POLL_RATE);

	logger.debug?.("Setting timeouts for reminders from " + formatDateHMS(nextExpiryStartTime) + " to " + formatDateHMS(end));

	const reminders = await getRemindersByFiresAt(nextExpiryStartTime, end);
	nextExpiryStartTime = end;

	for (const reminder of reminders)
		setFireTimeout(reminder);
}

function setFireTimeout(reminder: Reminder) {
	const delay = Math.max(0, reminder.firesAt.getTime() - Date.now());
	setTimeout(() => fire(reminder), delay);

	logger.debug?.(`Setting up timeout for reminder #${reminder.number} in ${debugFormatGuildByID(reminder.guildID)} with delay ${delay}`);
}

async function fire(reminder: Reminder) {
	// delete it right away - don't remind the user awkwardly late!
	if (!await deleteReminder(reminder.guildID, reminder.number))
		return;

	const guild = bot.guilds.get(reminder.guildID);

	// TODO: should these issues be reported to somebody
	// members could also be bulk requested ahead of time

	if (guild === undefined)
		return; // no access to guild?

	const channel = guild.channels.get(reminder.channelID);

	if (channel === undefined)
		return; // deleted

	if (!(channel instanceof TextableChannel))
		return;

	if (!canWriteInChannel(channel, guild.clientMember))
		return;

	try {
		var owner = await getMemberCached(guild, reminder.ownerID);
	} catch (error) {
		if (!(error instanceof DiscordRESTError))
			throw error;

		return;
	}

	// don't allow perm bypass
	if (!canWriteInChannel(channel, owner))
		return;

	let content = `${icons.bell} **Reminder for <@${reminder.ownerID}> set at <t:${Math.floor(reminder.createdAt.getTime() / 1000)}>!**`;

	if (reminder.message !== null)
		content += "\n>>> " + reminder.message;

	let flags = 0;

	if (reminder.silent)
		flags |= MessageFlags.SUPPRESS_NOTIFICATIONS;

	const ownerPerms = channel.permissionsOf(owner);

	if (!ownerPerms.has(Permissions.EMBED_LINKS))
		flags |= MessageFlags.SUPPRESS_EMBEDS;

	await channel.createMessage({
		content,
		flags,
		allowedMentions: { users: [reminder.ownerID] }
	});
}
