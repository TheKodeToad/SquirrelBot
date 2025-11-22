import { dbParse } from "#storage/index.ts";
import type { Pool } from "pg";
import z from "zod/v4";

const Tag = z.object({
	guildID: z.string(),
	name: z.string(),

	content: z.string(),
});

export type Tag = z.output<typeof Tag>;

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
