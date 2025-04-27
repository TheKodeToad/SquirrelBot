import { Routes } from "oceanic.js";
import { moduleLogger } from "../../../../common/logger/index.ts";
import { cleanUpMessageCacheEntries, getMessageCacheEntry, takeMessageCacheEntry, upsertMessageCacheEntry } from "../../../../db/logger/messageCache.ts";
import { Colors } from "../../../common/discord/colors.ts";
import { isTextableGuildChannel } from "../../../common/discord/typeGuards.ts";
import { bot } from "../../../index.ts";
import { defineEventListener } from "../../core/public/eventListener.ts";
import { loggingConfig, logToChannel } from "../index.ts";

const logger = moduleLogger();

const MESSAGE_CLEANUP_INTERVAL = 30 * 60 * 1000;
const MESSAGE_CLEANUP_THRESHOLD = 6 * 60 * 60 * 1000;

export const messageLoggerCreateListener = defineEventListener("messageCreate", async message => {
	if (message.guildID === null)
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

	const channel = message.guild.channels.get(config.channel);

	if (channel === undefined || !isTextableGuildChannel(channel))
		return;

	const entry = await getMessageCacheEntry(message.guild.id, message.channelID, message.id);

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

});

export const messageLoggerDeleteListener = defineEventListener("messageDelete", async message => {
	if (message.guild == null)
		return;

	const config = loggingConfig.get(message.guild.id);

	if (config === undefined)
		return;

	const channel = message.guild.channels.get(config.channel);

	if (channel === undefined || !isTextableGuildChannel(channel))
		return;

	const entry = await takeMessageCacheEntry(message.guild.id, message.channelID, message.id);

	if (entry === null)
		return;

	const iconURL = entry.authorAvatarHash !== null ?
		bot.util.formatImage(Routes.USER_AVATAR(entry.authorID, entry.authorAvatarHash))
		: undefined;

	await logToChannel(channel, {
		embeds: [{
			title: "Message Deleted",
			author: { name: entry.authorName, iconURL },
			description: entry.content,
			color: Colors.red,
		}]
	});
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
