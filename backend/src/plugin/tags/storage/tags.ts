import type { Tag } from "#plugin/tags/public/tag.ts";
import { dbParse } from "#storage/index.ts";
import type { Pool } from "pg";
import z from "zod";

const Tag = z.strictObject({
	name: z.string(),
	content: z.string(),
});

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
			SELECT "name", "content" FROM "tags_tags"
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
	tag: Tag,
): Promise<boolean> {
	const result = await db.query(
		`
			INSERT INTO "tags_tags" ("guildID", "name", "content")
			VALUES ($1, $2, $3)
			ON CONFLICT DO NOTHING
		`,
		[guildID, tag.name, tag.content],
	);

	return result.rowCount === 1;
}

export async function updateTag(
	db: Pool,
	guildID: string,
	name: string,
	content: string,
): Promise<Tag | null> {
	const result = await db.query(
		`
			WITH "old" AS (
				SELECT "content" FROM "tags_tags"
				WHERE "guildID" = $1 AND "name" = $2
			)
			UPDATE "tags_tags"
			SET "content" = $3
			WHERE "guildID" = $1 AND "name" = $2
			RETURNING "name", (SELECT "content" FROM "old") AS "content"
		`,
		[guildID, name, content],
	);

	if (result.rowCount !== 1) {
		return null;
	}

	return dbParse(Tag, result.rows[0]);
}

export async function deleteTag(
	db: Pool,
	guildID: string,
	name: string,
): Promise<Tag | null> {
	const result = await db.query(
		`
			DELETE FROM "tags_tags"
			WHERE "guildID" = $1 AND "name" = $2
			RETURNING "name", "content"
		`,
		[guildID, name],
	);

	if (result.rows.length !== 1) {
		return null;
	}

	return dbParse(Tag, result.rows[0]);
}
