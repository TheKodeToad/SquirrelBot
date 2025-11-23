import { dbParse } from "#storage/index.ts";
import type { Pool } from "pg";
import z from "zod";

const Tag = z.strictObject({
	guildID: z.string(),
	name: z.string(),

	content: z.string(),
});

export type Tag = z.output<typeof Tag>;

const JustInserted = z.strictObject({ inserted: z.boolean() });

export async function getTag(
	db: Pool,
	guildID: string,
	name: string,
): Promise<Tag | null> {
	const result = await db.query(
		`
			SELECT * FROM "tags_tags"
			WHERE "guildID" = $1 AND "name" = $2
		`,
		[guildID, name],
	);

	if (result.rowCount !== 1) {
		return null;
	}

	return dbParse(Tag, result.rows[0]);
}

export async function createTag(
	db: Pool,
	guildID: string,
	name: string,
	content: string,
): Promise<boolean> {
	const result = await db.query(
		`
			INSERT INTO "tags_tags" ("guildID", "name", "content")
			VALUES ($1, $2, $3)
			ON CONFLICT DO NOTHING
		`,
		[guildID, name, content],
	);

	return result.rowCount === 1;
}

export async function updateTag(
	db: Pool,
	guildID: string,
	name: string,
	content: string,
): Promise<boolean> {
	const result = await db.query(
		`
			UPDATE "tags_tags"
			SET "content" = $3
			WHERE "guildID" = $1 AND "name" = $2
		`,
		[guildID, name, content],
	);

	return result.rowCount === 1;
}

export async function upsertTag(
	db: Pool,
	guildID: string,
	name: string,
	content: string,
): Promise<{ inserted: boolean }> {
	const result = await db.query(
		`
			INSERT INTO "tags_tags" ("guildID", "name", "content")
			VALUES ($1, $2, $3)
			ON CONFLICT ("guildID", "name") DO UPDATE SET "content" = $3
			RETURNING (xmax = 0) AS "inserted"
		`,
		[guildID, name, content],
	);

	return dbParse(JustInserted, result.rows[0]);
}
