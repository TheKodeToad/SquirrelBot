import { getDefaultAvatarURL } from "#common/discord/urls.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { makeMemberUserView, makeUserView } from "#common/template/user.ts";
import { HOUR, MINUTE } from "#common/time.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { onBotEvent } from "#plugin/core/public/extensionPoints.ts";
import { logEvent } from "#plugin/logging/helper/logging.ts";
import { loggingConfigStore } from "#plugin/logging/index.ts";
import { cleanUpMessageCacheEntries, getMessageCacheEntry, takeMessageCacheEntry, upsertMessageCacheEntry } from "#plugin/logging/storage/messageCache.ts";
import { Message, Routes, type PossiblyUncachedMessage } from "oceanic.js";

const logger = moduleLogger();

const MESSAGE_CLEANUP_INTERVAL = 30 * MINUTE;
const MESSAGE_CLEANUP_THRESHOLD = 6 * HOUR;

export default [
	onBotInit(beginMessageCleanupLoop),
	onBotEvent({ type: "messageCreate", listener: handleCreate }),
	onBotEvent({ type: "messageUpdate", listener: handleUpdate }),
	onBotEvent({ type: "messageDelete", listener: handleDelete }),
];

async function beginMessageCleanupLoop(ctx: SquirrelDiscordContext): Promise<void> {
	try {
		logger.debug?.("Cleaning up old message cache entries");

		const deletedCount = await cleanUpMessageCacheEntries(ctx.db, new Date(Date.now() - MESSAGE_CLEANUP_THRESHOLD));

		logger.debug?.(`Deleted ${deletedCount} message cache entries`);
	} finally {
		setTimeout(() => beginMessageCleanupLoop(ctx), MESSAGE_CLEANUP_INTERVAL).unref();
	}
}

async function handleCreate(ctx: SquirrelDiscordContext, message: Message): Promise<void> {
	if (message.guildID === null)
		return;

	const config = loggingConfigStore.get(message.guildID);

	if (config === undefined)
		return;

	const shouldTrack = config.loggers.some(logger => logger.events.message_edit || logger.events.message_delete);

	if (!shouldTrack)
		return;

	await upsertMessageCacheEntry(ctx.db, message.guildID, message.channelID, message.id, {
		authorID: message.author.id,
		authorName: message.author.tag,
		authorAvatarHash: message.author.avatar,
		content: message.content,
	});
}

async function handleUpdate(ctx: SquirrelDiscordContext, message: Message): Promise<void> {
	if (message.guild === null)
		return;

	await logEvent(ctx, message.guild, message.channelID, "message_edit", async () => {
			const entry = await getMessageCacheEntry(ctx.db, message.guild!.id, message.channelID, message.id);

			if (entry?.content === message.content)
				return null;

			// discord really loves to spam edit events when viewing old messages
			if (message.content.length === 0)
				return null;

			await upsertMessageCacheEntry(ctx.db, message.guild!.id, message.channelID, message.id, {
				authorID: message.author.id,
				authorName: message.author.tag,
				authorAvatarHash: message.author.avatar,
				content: message.content,
			});

			return {
				author: message.member !== undefined ? makeMemberUserView(message.member) : makeUserView(message.author),
				old_message: { content: entry?.content },
				new_message: { content: message.content }
			};
		}
	);
}

async function handleDelete(ctx: SquirrelDiscordContext, message: PossiblyUncachedMessage): Promise<void> {
	if (message.guild == null)
		return;

	await logEvent(ctx, message.guild, message.channelID, "message_delete", async () => {
			const entry = await takeMessageCacheEntry(ctx.db, message.guild!.id, message.channelID, message.id);

			if (entry === null)
				return null;

			const avatarURL = entry.authorAvatarHash !== null
				? ctx.bot.util.formatImage(Routes.USER_AVATAR(entry.authorID, entry.authorAvatarHash))
				: getDefaultAvatarURL(ctx.bot, BigInt(entry.authorID));

			return {
				author: {
					id: entry.authorID,
					tag: entry.authorName,
					avatar: avatarURL
				},
				message: { content: entry.content }
			};
		}
	);

}
