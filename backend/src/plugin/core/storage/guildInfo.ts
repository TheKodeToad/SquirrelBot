import { dbParse, postgres } from "#storage/index.ts";
import { array, boolean, date, nullable, object, string, type InferOutput } from "valibot";

const guildInfoSchema = object({
	id: string(),
	name: nullable(string()),
	iconHash: nullable(string()),
	ownerID: nullable(string()),
	allowed: boolean(),
	deleteAt: nullable(date()),
});

const guildInfoArraySchema = array(guildInfoSchema);

export interface GuildInfo extends InferOutput<typeof guildInfoSchema> { }

const apiGuildInfoSchema = object({
	id: string(),
	name: nullable(string()),
	iconHash: nullable(string()),
	ownerID: nullable(string()),
});

const apiGuildInfoArraySchema = array(apiGuildInfoSchema);

export interface APIGuildInfo extends InferOutput<typeof apiGuildInfoSchema> { }

const justOwnerIDSchema = object({ ownerID: string() });

export async function getGuildInfo(id: string): Promise<GuildInfo | null> {
	const result = await postgres.query(
		`
			SELECT
				"id",
				"name",
				"iconHash",
				"ownerID",
				"allowed",
				"deleteAt"
			FROM "core_guildInfo"
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
	const result = await postgres.query(`
		SELECT
			"id",
			"name",
			"iconHash",
			"ownerID",
			"allowed",
			"deleteAt"
		FROM "core_guildInfo"
	`);

	return dbParse(guildInfoArraySchema, result.rows);
}

export async function getGuildOwnerID(id: string): Promise<string | null> {
	const result = await postgres.query(
		`
			SELECT "ownerID"
			FROM "core_guildInfo"
			WHERE "id" = $1
		`,
		[id]
	);

	if (result.rowCount !== 1)
		return null;

	return dbParse(justOwnerIDSchema, result.rows[0]).ownerID;
}

export async function getAPIGuildInfoByOwner(ownerID: string): Promise<APIGuildInfo[]> {
	const result = await postgres.query(
		`
			SELECT
				"id",
				"name",
				"iconHash",
				"ownerID"
			FROM "core_guildInfo"
			WHERE "ownerID" = $1
			ORDER BY "name" ASC
		`,
		[ownerID]
	);

	return dbParse(apiGuildInfoArraySchema, result.rows);
}

export async function deleteGuildInfo(id: string): Promise<void> {
	await postgres.query(
		`
			DELETE FROM "core_guildInfo"
			WHERE "id" = $1
		`,
		[id]
	);
}

export async function updateGuildInfo(id: string, name: string, iconHash: string | null, ownerID: string | null): Promise<void> {
	await postgres.query(
		`
			UPDATE "core_guildInfo"
			SET
				"name" = $2,
				"iconHash" = $3,
				"ownerID" = $4
			WHERE "id" = $1
		`,
		[id, name, iconHash, ownerID]
	);
}

export async function insertGuildInfo(id: string, name: string | null, iconHash: string | null, ownerID: string | null, allowed: boolean): Promise<boolean> {
	const result = await postgres.query(
		`
			INSERT INTO "core_guildInfo" (
				"id",
				"name",
				"iconHash",
				"ownerID",
				"allowed"
			)
			VALUES ($1, $2, $3, $4, $5)
		`,
		[id, name, iconHash, ownerID, allowed]
	);

	return result.rowCount === 1;
}

export async function markGuildAllowed(id: string, name: string | null, iconHash: string | null, ownerID: string | null): Promise<void> {
	await postgres.query(
		`
			INSERT INTO "core_guildInfo" (
				"id",
				"name",
				"iconHash",
				"ownerID",
				"allowed"
			)
			VALUES ($1, $2, $3, $4, TRUE)
			ON CONFLICT ("id") DO UPDATE SET
				"name" = $2,
				"iconHash" = $3,
				"ownerID" = $4,
				"allowed" = TRUE,
				"deleteAt" = NULL
		`,
		[id, name, iconHash, ownerID]
	);
}

export async function markUnknownGuildAllowed(id: string): Promise<void> {
	await postgres.query(
		`
			INSERT INTO "core_guildInfo" ("id", "allowed")
			VALUES ($1, TRUE)
			ON CONFLICT ("id") DO UPDATE SET
				"allowed" = TRUE,
				"deleteAt" = NULL
		`,
		[id]
	);
}

export async function markGuildNotAllowed(id: string): Promise<void> {
	await postgres.query(
		`
			UPDATE "core_guildInfo"
			SET "allowed" = FALSE
			WHERE "id" = $1
		`,
		[id]
	);
}

export async function scheduleGuildInfoDeletion(id: string): Promise<Date | null> {
	const date = new Date;
	date.setDate(date.getDate() + 30);

	const result = await postgres.query(
		`
			UPDATE "core_guildInfo"
			SET
				"allowed" = FALSE,
				"deleteAt" = $2
			WHERE
				"id" = $1
				AND "deleteAt" IS NULL
		`,
		[id, date]
	);

	if (result.rowCount !== 0)
		return date;
	else
		return null;
}

export async function cancelGuildInfoDeletion(id: string): Promise<void> {
	await postgres.query(
		`
			UPDATE "core_guildInfo"
			SET "deleteAt" = NULL
			WHERE "id" = $1
		`,
		[id]
	);
}

export async function deleteExpiredGuildInfo(): Promise<void> {
	await postgres.query(
		`
			DELETE FROM "core_guildInfo"
			WHERE "deleteAt" <= $1
		`,
		[new Date]
	);
}
