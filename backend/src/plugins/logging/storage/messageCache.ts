import { dbParse } from "#storage/storage.ts";
import type { Pool } from "pg";
import z from "zod";

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
export type MessageCacheEntry = z.output<typeof MessageCacheEntry>;

export namespace messageCacheTable {
	export async function get(
		db: Pool,
		guildID: string,
		channelID: string,
		id: string,
	): Promise<MessageCacheEntry | null> {
		const result = await db.query(
			`
				SELECT * FROM "logging_messageCache"
				WHERE "guildID" = $1 AND "channelID" = $2 AND "id" = $3
			`,
			[guildID, channelID, id],
		);

		if (result.rowCount !== 1) {
			return null;
		}

		return dbParse(MessageCacheEntry, result.rows[0]);
	}

	export async function upsert(
		db: Pool,
		entry: MessageCacheEntry,
	): Promise<void> {
		// TODO check whether this works properly
		await db.query(
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
			[
				entry.guildID,
				entry.channelID,
				entry.id,
				entry.lastUpdated,
				entry.authorID,
				entry.authorName,
				entry.authorAvatarHash,
				entry.content,
			],
		);
	}

	export async function take(
		db: Pool,
		guildID: string,
		channelID: string,
		id: string,
	): Promise<MessageCacheEntry | null> {
		const result = await db.query(
			`
				DELETE FROM "logging_messageCache"
				WHERE "guildID" = $1 AND "channelID" = $2 AND "id" = $3
				RETURNING *
			`,
			[guildID, channelID, id],
		);

		if (result.rowCount !== 1) {
			return null;
		}

		return dbParse(MessageCacheEntry, result.rows[0]);
	}

	export async function cleanUp(db: Pool, threshold: Date): Promise<number> {
		const result = await db.query(
			`
				DELETE FROM "logging_messageCache"
				WHERE "lastUpdated" <= $1
			`,
			[threshold],
		);

		return result.rowCount ?? 0;
	}
}
