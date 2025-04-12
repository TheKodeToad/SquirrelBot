import { array, boolean, date, nullable, object, string, type InferOutput } from "valibot";
import { dbParse, pool } from "../index.ts";

const guildInfoSchema = object({
	id: string(),
	name: nullable(string()),
	icon_hash: nullable(string()),
	owner_id: nullable(string()),
	allowed: boolean(),
	delete_at: nullable(date()),
});

const guildInfoArraySchema = array(guildInfoSchema);

export interface GuildInfo extends InferOutput<typeof guildInfoSchema> { }

export async function getGuildInfo(id: string): Promise<GuildInfo | null> {
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

	return dbParse(guildInfoSchema, result.rows[0]);
}

/**
 * Only use for caching purposes!
 */
export async function getAllGuildInfo(): Promise<GuildInfo[]> {
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

	return dbParse(guildInfoArraySchema, result.rows);
}

export async function getGuildOwnerID(id: string): Promise<string | null> {
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

	return dbParse(string(), result.rows[0].owner_id);
}

export async function getGuildInfoByOwner(ownerID: string): Promise<GuildInfo[]> {
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
		[ownerID]
	);

	return dbParse(guildInfoArraySchema, result.rows);
}

export async function deleteGuildInfo(id: string): Promise<void> {
	await pool.query(
		`
			DELETE FROM "core_guild_info"
			WHERE "id" = $1
		`,
		[id]
	);
}

export async function updateGuildInfo(id: string, name: string, iconHash: string | null, ownerID: string | null): Promise<void> {
	await pool.query(
		`
			UPDATE "core_guild_info"
			SET
				"name" = $2,
				"icon_hash" = $3,
				"owner_id" = $4
			WHERE "id" = $1
		`,
		[id, name, iconHash, ownerID]
	);
}

export async function insertGuildInfo(id: string, name: string | null, iconHash: string | null, ownerID: string | null, allowed: boolean): Promise<boolean> {
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
		[id, name, iconHash, ownerID, allowed]
	);

	return result.rowCount === 1;
}

export async function markGuildAllowed(id: string, name: string | null, iconHash: string | null, ownerID: string | null): Promise<void> {
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
		[id, name, iconHash, ownerID]
	);
}

export async function markUnknownGuildAllowed(id: string): Promise<void> {
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

export async function markGuildNotAllowed(id: string): Promise<void> {
	await pool.query(
		`
			UPDATE "core_guild_info"
			SET "allowed" = FALSE
			WHERE "id" = $1
		`,
		[id]
	);
}

export async function scheduleGuildInfoDeletion(id: string): Promise<Date | null> {
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

export async function cancelGuildInfoDeletion(id: string): Promise<void> {
	await pool.query(
		`
			UPDATE "core_guild_info"
			SET "delete_at" = NULL
			WHERE "id" = $1
		`,
		[id]
	);
}

export async function deleteExpiredGuildInfo(): Promise<void> {
	await pool.query(
		`
			DELETE FROM "core_guild_info"
			WHERE "delete_at" <= $1
		`,
		[new Date]
	);
}
