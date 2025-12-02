import type { Nullable } from "#common/general.ts";
import type { Tag } from "#plugins/tags/public/tag.ts";
import { dbParse } from "#storage/storage.ts";
import type { Pool } from "pg";
import z from "zod";

const Tag = z.strictObject({
	name: z.string(),
	content: z.string(),
	attachments: z.string().array().readonly(),
	color: z.number(),
});
const OldTag = Tag.omit({ name: true });

export namespace tagsTable {
	export async function get(
		db: Pool,
		guildID: string,
		name: string,
	): Promise<Tag | null> {
		const result = await db.query(
			`
				SELECT "name", "content", "attachments", "color" FROM "tags_tags"
				WHERE "guildID" = $1 AND "name" = $2
			`,
			[guildID, name],
		);

		if (result.rowCount !== 1) {
			return null;
		}

		return dbParse(Tag, result.rows[0]);
	}

	export interface Query {
		name: string;

		limit: number;
	}

	const JustNameArray = z.strictObject({ name: z.string() }).array();

	export async function queryNames(
		db: Pool,
		guildID: string,
		query: Query,
	): Promise<string[]> {
		// TODO: use casefold
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

	export async function insert(
		db: Pool,
		guildID: string,
		tag: Tag,
	): Promise<boolean> {
		const result = await db.query(
			`
				INSERT INTO "tags_tags" ("guildID", "name", "content", "attachments", "color")
				VALUES ($1, $2, $3, $4, $5)
				ON CONFLICT DO NOTHING
			`,
			[guildID, tag.name, tag.content, tag.attachments, tag.color],
		);

		return result.rowCount === 1;
	}

	export async function update(
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
				SET "name" = COALESCE($3, "name"), "content" = COALESCE($4, "content"), "color" = COALESCE($5, "color"), "attachments" = COALESCE($6, "attachments")
				WHERE "guildID" = $1 AND "name" = $2
				RETURNING (SELECT "content" FROM "old") AS "content", (SELECT "attachments" FROM "old") AS "attachments", (SELECT "color" FROM "old") AS "color"
			`,
			[guildID, name, tag.name, tag.content, tag.color, tag.attachments],
		);

		if (result.rowCount !== 1) {
			return null;
		}

		return {
			name,
			...dbParse(OldTag, result.rows[0]),
		};
	}

	export async function remove(
		db: Pool,
		guildID: string,
		name: string,
	): Promise<Tag | null> {
		const result = await db.query(
			`
				DELETE FROM "tags_tags"
				WHERE "guildID" = $1 AND "name" = $2
				RETURNING "name", "content", "attachments", "color"
			`,
			[guildID, name],
		);

		if (result.rows.length !== 1) {
			return null;
		}

		return dbParse(Tag, result.rows[0]);
	}
}
