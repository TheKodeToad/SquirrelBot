import { array, boolean, date, nullable, object, string, type InferOutput } from "valibot";
import { db_parse, pool } from "../index.ts";

const guild_info_schema = object({
	id: string(),
	name: nullable(string()),
	icon_hash: nullable(string()),
	owner_id: nullable(string()),
	allowed: boolean(),
	delete_at: nullable(date()),
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
				"owner_id",
				"allowed",
				"delete_at"
			FROM "core_guild_info"
			WHERE "id" = $1
		`,
		[id]
	);

	if (result.rowCount !== 1)
		return null;

	return db_parse(guild_info_schema, result.rows[0]);
}

/**
 * Only use for caching purposes!
 */
export async function get_all_guild_info(): Promise<GuildInfo[]> {
	const result = await pool.query(`
		SELECT
			"id",
			"name",
			"icon_hash",
			"owner_id",
			"allowed",
			"delete_at"
		FROM "core_guild_info"
	`);

	return db_parse(guild_info_array_schema, result.rows);
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

export async function update_guild_info(id: string, name: string, icon_hash: string | null, owner_id: string | null): Promise<void> {
	await pool.query(
		`
			UPDATE "core_guild_info"
			SET
				"name" = $2,
				"icon_hash" = $3,
				"owner_id" = $4
			WHERE "id" = $1
		`,
		[id, name, icon_hash, owner_id]
	);
}

export async function insert_guild_info(id: string, name: string | null, icon_hash: string | null, owner_id: string | null, allowed: boolean): Promise<boolean> {
	const result = await pool.query(
		`
			INSERT INTO "core_guild_info" (
				"id",
				"name",
				"icon_hash",
				"owner_id",
				"allowed"
			)
			VALUES ($1, $2, $3, $4, $5)
		`,
		[id, name, icon_hash, owner_id, allowed]
	);

	return result.rowCount === 1;
}

export async function mark_guild_allowed(id: string, name: string | null, icon_hash: string | null, owner_id: string | null): Promise<void> {
	await pool.query(
		`
			INSERT INTO "core_guild_info" (
				"id",
				"name",
				"icon_hash",
				"owner_id",
				"allowed"
			)
			VALUES ($1, $2, $3, $4, TRUE)
			ON CONFLICT ("id") DO UPDATE SET
				"name" = $2,
				"icon_hash" = $3,
				"owner_id" = $4,
				"allowed" = TRUE,
				"delete_at" = NULL
		`,
		[id, name, icon_hash, owner_id]
	);
}

export async function mark_unknown_guild_allowed(id: string): Promise<void> {
	await pool.query(
		`
			INSERT INTO "core_guild_info" ("id", "allowed")
			VALUES ($1, TRUE)
			ON CONFLICT ("id") DO UPDATE SET
				"allowed" = TRUE,
				"delete_at" = NULL
		`,
		[id]
	);
}

export async function mark_guild_not_allowed(id: string): Promise<void> {
	await pool.query(
		`
			UPDATE "core_guild_info"
			SET "allowed" = FALSE
			WHERE "id" = $1
		`,
		[id]
	);
}

export async function schedule_guild_info_deletion(id: string): Promise<Date | null> {
	const date = new Date;
	date.setDate(date.getDate() + 30);

	const result = await pool.query(
		`
			UPDATE "core_guild_info"
			SET
				"allowed" = FALSE,
				"delete_at" = $2
			WHERE
				"id" = $1
				AND "delete_at" IS NULL
		`,
		[id, date]
	);

	if (result.rowCount !== 0)
		return date;
	else
		return null;
}

export async function cancel_guild_info_deletion(id: string): Promise<void> {
	await pool.query(
		`
			UPDATE "core_guild_info"
			SET "delete_at" = NULL
			WHERE "id" = $1
		`,
		[id]
	);
}

export async function delete_expired_guild_info(): Promise<void> {
	await pool.query(
		`
			DELETE FROM "core_guild_info"
			WHERE "delete_at" <= $1
		`,
		[new Date]
	);
}
