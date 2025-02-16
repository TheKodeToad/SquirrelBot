import { array, object, string, type InferOutput } from "valibot";
import { db_parse, pool } from "../index.ts";

const guild_info_schema = object({
	id: string(),
	name: string(),
	icon_hash: string(),
	owner_id: string()
});

const guild_info_array_schema = array(guild_info_schema);

export interface GuildInfo extends InferOutput<typeof guild_info_schema> { }

export async function get_guild_info(id: string): Promise<GuildInfo | null> {
	const result = await pool.query(
		`
			SELECT
				"id",
				"name",
				"icon_hash",
				"owner_id"
			FROM "core_guild_info"
			WHERE "id" = $1
		`,
		[id]
	);

	if (result.rowCount !== 1)
		return null;

	return db_parse(guild_info_schema, result.rows[0]);
}

export async function get_guild_owner_id(id: string): Promise<string | null> {
	const result = await pool.query(
		`
			SELECT "owner_id"
			FROM "core_guild_info"
			WHERE "id" = $1
		`,
		[id]
	);

	if (result.rowCount !== 1)
		return null;

	return db_parse(string(), result.rows[0].owner_id);
}

export async function get_guild_info_by_owner(owner_id: string): Promise<GuildInfo[]> {
	const result = await pool.query(
		`
			SELECT
				"id",
				"name",
				"icon_hash",
				"owner_id"
			FROM "core_guild_info"
			WHERE "owner_id" = $1
		`,
		[owner_id]
	);

	return db_parse(guild_info_array_schema, result.rows);
}

export async function delete_guild_info(id: string): Promise<void> {
	await pool.query(
		`
			DELETE FROM "core_guild_info"
			WHERE "id" = $1
		`,
		[id]
	);
}

export async function upsert_guild_info(id: string, name: string, icon_hash: string | null, owner_id: string | null): Promise<void> {
	await pool.query(
		`
			INSERT INTO "core_guild_info" (
				"id",
				"name",
				"icon_hash",
				"owner_id"
			)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT ("id")
			DO UPDATE SET
				"name" = $2,
				"icon_hash" = $3,
				"owner_id" = $4
		`,
		[id, name, icon_hash, owner_id]
	);
}
