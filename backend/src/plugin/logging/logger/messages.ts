import { moduleLogger } from "#common/logger/index.ts";
import { HOUR, MINUTE } from "#common/time.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import { bot } from "#discord/index.ts";
import { onBotEvent } from "#plugin/core/public/extensionPoints.ts";
import { logWithLogger } from "#plugin/logging/helper/webhooks.ts";
import { loggingConfigStore } from "#plugin/logging/index.ts";
import { cleanUpMessageCacheEntries, getMessageCacheEntry, takeMessageCacheEntry, upsertMessageCacheEntry, type MessageCacheEntry } from "#plugin/logging/storage/messageCache.ts";
import { Message, Routes } from "oceanic.js";

const logger = moduleLogger();

const MESSAGE_CLEANUP_INTERVAL = 30 * MINUTE;
const MESSAGE_CLEANUP_THRESHOLD = 6 * HOUR;

export default [
	onBotInit(beginMessageCleanupLoop),
	onBotEvent({ type: "messageCreate", listener: handleCreate }),
	onBotEvent({ type: "messageUpdate", listener: handleUpdate }),
	onBotEvent({ type: "messageDelete", listener: handleDelete }),
];

export async function beginMessageCleanupLoop(): Promise<void> {
	try {
		logger.debug?.("Cleaning up old message cache entries");

		const deletedCount = await cleanUpMessageCacheEntries(new Date(Date.now() - MESSAGE_CLEANUP_THRESHOLD));

		logger.debug?.(`Deleted ${deletedCount} message cache entries`);
	} finally {
		setTimeout(beginMessageCleanupLoop, MESSAGE_CLEANUP_INTERVAL).unref();
	}
}

async function handleCreate(message: Message): Promise<void> {
	if (message.guildID === null)
		return;

	const config = loggingConfigStore.get(message.guildID);

	if (config === undefined)
		return;

	const shouldTrack = config.loggers.some(logger => logger.events.message_edit || logger.events.message_delete);

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

		if (!message_edit)
			continue;

		entry ??= await getMessageCacheEntry(message.guild.id, message.channelID, message.id);

		await upsertMessageCacheEntry(message.guild.id, message.channelID, message.id, {
			authorID: message.author.id,
			authorName: message.author.tag,
			authorAvatarHash: message.author.avatar,
			content: message.content,
		});

		await logWithLogger(logger, message.guild, message_edit.message({
			author: message.author,
			author_avatar: message.author.avatarURL(),
			old_content: entry?.content,
			new_content: message.content
		}));
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

	const avatarURL = entry.authorAvatarHash !== null ?
		bot.util.formatImage(Routes.USER_AVATAR(entry.authorID, entry.authorAvatarHash))
		: undefined;

	for (const logger of config.loggers) {
		const { message_delete } = logger.events;

		if (!message_delete)
			continue;

		await logWithLogger(logger, message.guild, message_delete.message({
			author: { id: entry.authorID, tag: entry.authorName },
			author_avatar: avatarURL,
			content: entry.content,
		}));
	}
}
