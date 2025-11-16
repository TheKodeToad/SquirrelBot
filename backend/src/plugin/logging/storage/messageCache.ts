import { dbParse, sqlite } from "#storage/index.ts";
import z from "zod/v4";

const MessageCacheEntry = z.strictObject({
	guildID: z.string(),
	channelID: z.string(),
	id: z.string(),
	lastUpdated: z.date(),
	authorID: z.string(),
	authorName: z.string(),
	authorAvatarHash: z.string().nullable(),
	content: z.string(),
});

export interface MessageCacheEntry extends z.output<typeof MessageCacheEntry> { }

interface CreateMessageCacheEntryOptions {
	authorID: string;
	authorName: string;
	authorAvatarHash: string | null;
	content: string;
}

export function upsertMessageCacheEntry(
	guildID: string,
	channelID: string,
	id: string,
	entry: CreateMessageCacheEntryOptions
): void {
	// TODO check whether this works properly
	sqlite.prepare(
		`
			INSERT INTO "logging_messageCache" (
				"guildID",
				"channelID",
				"id",
				"lastUpdated",
				"authorID",
				"authorName",
				"authorAvatarHash",
				"content"
			)
			VALUES (
				$guildID,
				$channelID,
				$id,
				$lastUpdated,
				$authorID,
				$authorName,
				$authorAvatarHash,
				$content
			)
			ON CONFLICT ("guildID", "channelID", "id")
				DO UPDATE
					SET
						"authorID" = $authorID,
						"authorName" = $authorName,
						"authorAvatarHash" = $authorAvatarHash,
						"content" = $content
					WHERE "logging_messageCache"."lastUpdated" <= $lastUpdated
		`
	).run({
		guildID,
		channelID,
		id,
		lastUpdated: new Date,
		...entry
	});
}

export async function getMessageCacheEntry(guildID: string, channelID: string, id: string): Promise<MessageCacheEntry | null> {
	const result = sqlite.prepare(

		`
			SELECT * FROM "logging_messageCache"
			WHERE "guildID" = ? AND "channelID" = ? AND "id" = ?
		`
	).get(guildID, channelID, id);

	if (result === undefined)
		return null;

	return dbParse(MessageCacheEntry, result);
}

export async function takeMessageCacheEntry(guildID: string, channelID: string, id: string): Promise<MessageCacheEntry | null> {
	const result = sqlite.prepare(
		`
			DELETE FROM "logging_messageCache"
			WHERE "guildID" = ? AND "channelID" = ? AND "id" = ?
			RETURNING *
		`
	).get(guildID, channelID, id);

	if (result === undefined)
		return null;

	return dbParse(MessageCacheEntry, result);
}

export async function cleanUpMessageCacheEntries(threshold: Date): Promise<number> {
	const result = sqlite.prepare(
		`
			DELETE FROM "logging_messageCache"
			WHERE "lastUpdated" <= ?
		`,
	).run(threshold);

	return result.changes;
}
