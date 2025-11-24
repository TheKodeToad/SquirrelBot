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
const JustNameArray = z.strictObject({ name: z.string() }).array();

export interface TagQuery {
	name: string;

	limit: number;
}

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

export async function searchTagNames(
	db: Pool,
	guildID: string,
	query: TagQuery,
): Promise<string[]> {
	// FIXME: use casefold
	const result = await db.query(
		`
			SELECT "name" FROM "tags_tags"
			WHERE "guildID" = $1 AND position(lower($2) in lower("name")) > 0
			ORDER BY position(lower($2) in lower("name")), "name" ASC
			LIMIT $3
		`,
		[guildID, query.name, query.limit],
	);

	return dbParse(JustNameArray, result.rows).map(({ name }) => name);
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

export async function deleteTag(
	db: Pool,
	guildID: string,
	name: string,
): Promise<boolean> {
	const result = await db.query(
		`
			DELETE FROM "tags_tags"
			WHERE "guildID" = $1 AND "name" = $2
		`,
		[guildID, name],
	);

	return result.rowCount !== 0;
}
