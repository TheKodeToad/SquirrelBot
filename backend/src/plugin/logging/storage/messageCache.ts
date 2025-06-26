import { dbParse, postgres } from "#storage/index.ts";
import { date, nullable, strictObject, string, type InferOutput } from "valibot";

const messageCacheEntrySchema = strictObject({
	guildID: string(),
	channelID: string(),
	id: string(),
	lastUpdated: date(),
	authorID: string(),
	authorName: string(),
	authorAvatarHash: nullable(string()),
	content: string(),
});

export interface MessageCacheEntry extends InferOutput<typeof messageCacheEntrySchema> { }

interface CreateMessageCacheEntryOptions {
	authorID: string;
	authorName: string;
	authorAvatarHash: string | null;
	content: string;
}

export async function upsertMessageCacheEntry(
	guildID: string,
	channelID: string,
	id: string,
	entry: CreateMessageCacheEntryOptions
): Promise<void> {
	// TODO check whether this works properly
	await postgres.query(
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
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT ("guildID", "channelID", "id")
				DO UPDATE
					SET "authorID" = $5, "authorName" = $6, "authorAvatarHash" = $7, "content" = $8
					WHERE "logging_messageCache"."lastUpdated" <= $4
		`,
		[guildID, channelID, id, new Date, entry.authorID, entry.authorName, entry.authorAvatarHash, entry.content]
	);
}

export async function getMessageCacheEntry(guildID: string, channelID: string, id: string): Promise<MessageCacheEntry | null> {
	const result = await postgres.query(

		`
			SELECT * FROM "logging_messageCache"
			WHERE "guildID" = $1 AND "channelID" = $2 AND "id" = $3
		`,
		[guildID, channelID, id]
	);

	if (result.rowCount !== 1)
		return null;

	return dbParse(messageCacheEntrySchema, result.rows[0]);
}

export async function takeMessageCacheEntry(guildID: string, channelID: string, id: string): Promise<MessageCacheEntry | null> {
	const result = await postgres.query(
		`
			DELETE FROM "logging_messageCache"
			WHERE "guildID" = $1 AND "channelID" = $2 AND "id" = $3
			RETURNING *
		`,
		[guildID, channelID, id]
	);

	if (result.rowCount !== 1)
		return null;

	return dbParse(messageCacheEntrySchema, result.rows[0]);
}

export async function cleanUpMessageCacheEntries(threshold: Date): Promise<number> {
	const result = await postgres.query(
		`
			DELETE FROM "logging_messageCache"
			WHERE "lastUpdated" <= $1
		`,
		[threshold]
	);

	return result.rowCount ?? 0;
}
