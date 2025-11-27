import type { Nullable } from "#common/general.ts";
import type { Tag } from "#plugin/tags/public/tag.ts";
import { dbParse } from "#storage/index.ts";
import type { Pool } from "pg";
import z from "zod";

const Tag = z.strictObject({
	name: z.string(),
	content: z.string(),
	attachments: z.string().array().readonly(),
});

const JustNameArray = z.strictObject({ name: z.string() }).array();
const OldTag = Tag.omit({ name: true });

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
			SELECT "name", "content", "attachments" FROM "tags_tags"
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
			INSERT INTO "tags_tags" ("guildID", "name", "content", "attachments")
			VALUES ($1, $2, $3, $4)
			ON CONFLICT DO NOTHING
		`,
		[guildID, tag.name, tag.content, tag.attachments],
	);

	return result.rowCount === 1;
}

export async function updateTag(
	db: Pool,
	guildID: string,
	name: string,
	tag: Nullable<Tag>,
): Promise<Tag | null> {
	const result = await db.query(
		`
			WITH "old" AS (
				SELECT "content", "attachments" FROM "tags_tags"
				WHERE "guildID" = $1 AND "name" = $2
			)
			UPDATE "tags_tags"
			SET "name" = COALESCE($3, "name"), "content" = COALESCE($4, "content")
			WHERE "guildID" = $1 AND "name" = $2
			RETURNING (SELECT "content" FROM "old") AS "content", (SELECT "attachments" FROM "old") AS "attachments"
		`,
		[guildID, name, tag.name, tag.content],
	);

	console.log(result);

	if (result.rowCount !== 1) {
		return null;
	}

	return {
		name,
		...dbParse(OldTag, result.rows[0]),
	};
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
			RETURNING "name", "content", "attachments"
		`,
		[guildID, name],
	);

	if (result.rows.length !== 1) {
		return null;
	}

	return dbParse(Tag, result.rows[0]);
}
