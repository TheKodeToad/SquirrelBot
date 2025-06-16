import { fetchTextableGuildChannelCached } from "#common/discord/cachedRequest.ts";
import { colors } from "#common/discord/colors.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { HOUR, MINUTE } from "#common/time.ts";
import { bot } from "#discord/index.ts";
import { onBotEvent } from "#plugin/core/public/discord/extensionPoints.ts";
import { isEventConfigEnabled } from "#plugin/logging/discord/helper/config.ts";
import { logToChannel } from "#plugin/logging/discord/helper/webhooks.ts";
import { loggingConfigStore } from "#plugin/logging/index.ts";
import { cleanUpMessageCacheEntries, getMessageCacheEntry, takeMessageCacheEntry, upsertMessageCacheEntry, type MessageCacheEntry } from "#plugin/logging/storage/messageCache.ts";
import { Message, Routes } from "oceanic.js";

const logger = moduleLogger();

const MESSAGE_CLEANUP_INTERVAL = 30 * MINUTE;
const MESSAGE_CLEANUP_THRESHOLD = 6 * HOUR;

export default [
	onBotEvent({ type: "messageCreate", listener: handleCreate }),
	onBotEvent({ type: "messageUpdate", listener: handleUpdate }),
	onBotEvent({ type: "messageDelete", listener: handleDelete }),
];

async function handleCreate(message: Message): Promise<void> {
	if (message.guildID === null)
		return;

	const config = loggingConfigStore.get(message.guildID);

	if (config === undefined)
		return;

	const shouldTrack = config.loggers.some(logger => isEventConfigEnabled(logger.events.message_edit) || isEventConfigEnabled(logger.events.message_delete));

	if (!shouldTrack)
		return;

	await upsertMessageCacheEntry(message.guildID, message.channelID, message.id, {
		authorID: message.author.id,
		authorName: message.author.tag,
		authorAvatarHash: message.author.avatar,
		content: message.content,
	});
}

async function handleUpdate(message: Message): Promise<void> {
	if (message.guild === null)
		return;

	const config = loggingConfigStore.get(message.guild.id);

	if (config === undefined)
		return;

	let entry: MessageCacheEntry | null | undefined;

	for (const logger of config.loggers) {
		const { message_edit } = logger.events;

		if (!isEventConfigEnabled(message_edit))
			continue;

		const channel = await fetchTextableGuildChannelCached(message.guild, logger.channel);

		if (channel === null)
			continue;

		entry ??= await getMessageCacheEntry(message.guild.id, message.channelID, message.id);

		await upsertMessageCacheEntry(message.guild.id, message.channelID, message.id, {
			authorID: message.author.id,
			authorName: message.author.tag,
			authorAvatarHash: message.author.avatar,
			content: message.content,
		});

		await logToChannel(channel, {
			embeds: [{
				title: "Message Edited",
				author: { name: message.author.tag, iconURL: message.author.avatarURL() },
				fields: [
					{
						name: "Old Content",
						value: entry?.content ?? "*Not available.*",
					},
					{
						name: "New Content",
						value: message.content,
					}
				],
				color: colors.yellow,
			}]
		});
	}
}

async function handleDelete(message: Message): Promise<void> {
	if (message.guild == null)
		return;

	const config = loggingConfigStore.get(message.guild.id);

	if (config === undefined)
		return;

	const entry = await takeMessageCacheEntry(message.guild.id, message.channelID, message.id);

	if (entry === null)
		return;

	const iconURL = entry.authorAvatarHash !== null ?
		bot.util.formatImage(Routes.USER_AVATAR(entry.authorID, entry.authorAvatarHash))
		: undefined;

	for (const logger of config.loggers) {
		const { message_edit } = logger.events;

		if (!isEventConfigEnabled(message_edit))
			continue;

		const channel = await fetchTextableGuildChannelCached(message.guild, logger.channel);

		if (channel === null)
			continue;

		await logToChannel(channel, {
			embeds: [{
				title: "Message Deleted",
				author: { name: entry.authorName, iconURL },
				description: entry.content,
				color: colors.red,
				footer: { text: `Author ID: ${entry.authorID} • Message ID: ${entry.id}` }
			}]
		});
	}

}

export async function beginMessageCleanupLoop(): Promise<void> {
	try {
		logger.debug?.("Cleaning up old message cache entries");

		const deletedCount = await cleanUpMessageCacheEntries(new Date(Date.now() - MESSAGE_CLEANUP_THRESHOLD));

		logger.debug?.(`Deleted ${deletedCount} message cache entries`);
	} finally {
		setTimeout(beginMessageCleanupLoop, MESSAGE_CLEANUP_INTERVAL).unref();
	}
}
