import { dbParse, sqlite } from "#storage/index.ts";
import { z } from "zod/v4";

const GuildInfo = z.strictObject({
	id: z.string(),
	name: z.string().nullable(),
	iconHash: z.string().nullable(),
	ownerID: z.string().nullable(),
	allowed: z.boolean(),
	deleteAt: z.date().nullable(),
});

const GuildInfoArray = GuildInfo.array();

export interface GuildInfo extends z.output<typeof GuildInfo> { }

const APIGuildInfo = z.strictObject({
	id: z.string(),
	name: z.string().nullable(),
	iconHash: z.string().nullable(),
	ownerID: z.string().nullable(),
});

const APIGuildInfoArray = APIGuildInfo.array();

export interface APIGuildInfo extends z.output<typeof APIGuildInfo> { }

const JustOwnerID = z.strictObject({ ownerID: z.string() });

export function getGuildInfo(id: string): GuildInfo | null {
	const result = sqlite.prepare(
		`
			SELECT
				"id",
				"name",
				"iconHash",
				"ownerID",
				"allowed",
				"deleteAt"
			FROM "core_guildInfo"
			WHERE "id" = ?
		`
	).get(id);

	if (result === undefined)
		return null;

	return dbParse(GuildInfo, result);
}

/**
 * Only use for caching purposes!
 */
export function getAllGuildInfo(): GuildInfo[] {
	const result = sqlite.prepare(
		`
			SELECT
				"id",
				"name",
				"iconHash",
				"ownerID",
				"allowed",
				"deleteAt"
			FROM "core_guildInfo"
		`
	).all();

	return dbParse(GuildInfoArray, result);
}

export function getGuildOwnerID(id: string): string | null {
	const result = sqlite.prepare(
		`
			SELECT "ownerID"
			FROM "core_guildInfo"
			WHERE "id" = ?
		`
	).get(id);

	if (result === undefined)
		return null;

	return dbParse(JustOwnerID, result).ownerID;
}

export function getAPIGuildInfoByOwner(ownerID: string): APIGuildInfo[] {
	const result = sqlite.prepare(
		`
			SELECT
				"id",
				"name",
				"iconHash",
				"ownerID"
			FROM "core_guildInfo"
			WHERE "ownerID" = ?
			ORDER BY "name" ASC
		`
	).all(ownerID);

	return dbParse(APIGuildInfoArray, result);
}

export function deleteGuildInfo(id: string): void {
	sqlite.prepare(
		`
			DELETE FROM "core_guildInfo"
			WHERE "id" = ?
		`,
	).run(id);
}

export function updateGuildInfo(id: string, name: string, iconHash: string | null, ownerID: string | null): void {
	sqlite.prepare(
		`
			UPDATE "core_guildInfo"
			SET
				"name" = ?,
				"iconHash" = ?,
				"ownerID" = ?
			WHERE "id" = ?
		`,
	).run(name, iconHash, ownerID, id);
}

export function insertGuildInfo(id: string, name: string | null, iconHash: string | null, ownerID: string | null, allowed: boolean): boolean {
	const result = sqlite.prepare(
		`
			INSERT INTO "core_guildInfo" (
				"id",
				"name",
				"iconHash",
				"ownerID",
				"allowed"
			)
			VALUES (?, ?, ?, ?, ?)
		`
	).run(id, name, iconHash, ownerID, allowed);

	return result.changes === 1;
}

export function markGuildAllowed(id: string, name: string | null, iconHash: string | null, ownerID: string | null): void {
	sqlite.prepare(
		`
			INSERT INTO "core_guildInfo" (
				"id",
				"name",
				"iconHash",
				"ownerID",
				"allowed"
			)
			VALUES ($id, $name, $iconHash, $ownerID, TRUE)
			ON CONFLICT ("id") DO UPDATE SET
				"name" = $name,
				"iconHash" = $iconHash,
				"ownerID" = $ownerID,
				"allowed" = TRUE,
				"deleteAt" = NULL
		`
	).run({ id, name, iconHash, ownerID });
}

export function markUnknownGuildAllowed(id: string): void {
	sqlite.prepare(
		`
			INSERT INTO "core_guildInfo" ("id", "allowed")
			VALUES (?, TRUE)
			ON CONFLICT ("id") DO UPDATE SET
				"allowed" = TRUE,
				"deleteAt" = NULL
		`
	).run(id);
}

export function markGuildNotAllowed(id: string): void {
	sqlite.prepare(
		`
			UPDATE "core_guildInfo"
			SET "allowed" = FALSE
			WHERE "id" = ?
		`
	).run(id);
}

export function scheduleGuildInfoDeletion(id: string): Date | null {
	const date = new Date;
	date.setDate(date.getDate() + 30);

	const result = sqlite.prepare(
		`
			UPDATE "core_guildInfo"
			SET
				"allowed" = FALSE,
				"deleteAt" = ?
			WHERE
				"id" = ?
				AND "deleteAt" IS NULL
		`
	).run(date, id);

	if (result.changes !== 0)
		return date;
	else
		return null;
}

export function cancelGuildInfoDeletion(id: string): void {
	sqlite.prepare(
		`
			UPDATE "core_guildInfo"
			SET "deleteAt" = NULL
			WHERE "id" = ?
		`
	).run(id);
}

// TODO: use this darn thing!
export async function deleteExpiredGuildInfo(): Promise<void> {
	sqlite.prepare(
		`
			DELETE FROM "core_guildInfo"
			WHERE "deleteAt" <= ?
		`
	).run(new Date);
}
