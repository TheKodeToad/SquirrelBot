import { Routes } from "oceanic.js";
import { moduleLogger } from "../../../../common/logger/index.ts";
import { cleanUpMessageCacheEntries, getMessageCacheEntry, takeMessageCacheEntry, upsertMessageCacheEntry, type MessageCacheEntry } from "../../../../db/logger/messageCache.ts";
import { fetchTextableGuildChannelCached } from "../../../common/discord/cachedRequest.ts";
import { Colors } from "../../../common/discord/colors.ts";
import { bot } from "../../../index.ts";
import { defineEventListener } from "../../core/public/eventListener.ts";
import { isEventConfigEnabled } from "../helper/config.ts";
import { logToChannel } from "../helper/webhooks.ts";
import { loggingConfig } from "../index.ts";

const logger = moduleLogger();

const MESSAGE_CLEANUP_INTERVAL = 30 * 60 * 1000;
const MESSAGE_CLEANUP_THRESHOLD = 6 * 60 * 60 * 1000;

export const messageLoggerCreateListener = defineEventListener("messageCreate", async message => {
	if (message.guildID === null)
		return;

	const config = loggingConfig.get(message.guildID);

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
});

export const messageLoggerUpdateListener = defineEventListener("messageUpdate", async message => {
	if (message.guild === null)
		return;

	const config = loggingConfig.get(message.guild.id);

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
				color: Colors.yellow,
			}]
		});
	}
});

export const messageLoggerDeleteListener = defineEventListener("messageDelete", async message => {
	if (message.guild == null)
		return;

	const config = loggingConfig.get(message.guild.id);

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
				color: Colors.red,
				footer: { text: `Author ID: ${entry.authorID} • Message ID: ${entry.id}` }
			}]
		});
	}

});

export async function beginMessageCleanupLoop(): Promise<void> {
	try {
		logger.debug?.("Cleaning up old message cache entries");

		const deletedCount = await cleanUpMessageCacheEntries(new Date(Date.now() - MESSAGE_CLEANUP_THRESHOLD));

		logger.debug?.(`Deleted ${deletedCount} message cache entries`);
	} finally {
		setTimeout(beginMessageCleanupLoop, MESSAGE_CLEANUP_INTERVAL).unref();
	}
}
