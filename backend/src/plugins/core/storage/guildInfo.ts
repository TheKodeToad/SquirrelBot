import { dbParse } from "#storage/storage.ts";
import type { Pool } from "pg";
import { z } from "zod";

const GuildInfo = z.strictObject({
	id: z.string(),
	name: z.string().nullable(),
	iconHash: z.string().nullable(),
	ownerID: z.string().nullable(),
	allowed: z.boolean(),
	deleteAt: z.date().nullable(),
});
const GuildInfoArray = GuildInfo.array();
export type GuildInfo = z.output<typeof GuildInfo>;

const PublicGuildInfo = GuildInfo.pick({
	id: true,
	name: true,
	iconHash: true,
	ownerID: true,
});
const PublicGuildInfoArray = PublicGuildInfo.array();
export type PublicGuildInfo = z.output<typeof PublicGuildInfo>;

export namespace guildInfoTable {
	export async function get(db: Pool, id: string): Promise<GuildInfo | null> {
		const result = await db.query(
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
			[id],
		);

		if (result.rowCount !== 1) {
			return null;
		}

		return dbParse(GuildInfo, result.rows[0]);
	}

	const JustOwnerID = z.strictObject({ ownerID: z.string() });

	export async function getOwnerID(
		db: Pool,
		id: string,
	): Promise<string | null> {
		const result = await db.query(
			`
			SELECT "ownerID"
			FROM "core_guildInfo"
			WHERE "id" = $1
		`,
			[id],
		);

		if (result.rowCount !== 1) {
			return null;
		}

		return dbParse(JustOwnerID, result.rows[0]).ownerID;
	}

	export async function getPublicByOwner(
		db: Pool,
		ownerID: string,
	): Promise<PublicGuildInfo[]> {
		const result = await db.query(
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
			[ownerID],
		);

		return dbParse(PublicGuildInfoArray, result.rows);
	}

	/**
	 * Only use for caching purposes!
	 */
	export async function all(db: Pool): Promise<GuildInfo[]> {
		const result = await db.query(
			`
				SELECT
					"id",
					"name",
					"iconHash",
					"ownerID",
					"allowed",
					"deleteAt"
				FROM "core_guildInfo"
			`,
		);

		return dbParse(GuildInfoArray, result.rows);
	}

	export async function insert(
		db: Pool,
		id: string,
		name: string | null,
		iconHash: string | null,
		ownerID: string | null,
		allowed: boolean,
	): Promise<boolean> {
		const result = await db.query(
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
			[id, name, iconHash, ownerID, allowed],
		);

		return result.rowCount === 1;
	}

	export async function update(
		db: Pool,
		id: string,
		name: string,
		iconHash: string | null,
		ownerID: string | null,
	): Promise<void> {
		await db.query(
			`
				UPDATE "core_guildInfo"
				SET
					"name" = $2,
					"iconHash" = $3,
					"ownerID" = $4
				WHERE "id" = $1
			`,
			[id, name, iconHash, ownerID],
		);
	}

	export async function markAllowed(
		db: Pool,
		id: string,
		name: string | null,
		iconHash: string | null,
		ownerID: string | null,
	): Promise<void> {
		await db.query(
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
			[id, name, iconHash, ownerID],
		);
	}

	export async function markUnknownAllowed(
		db: Pool,
		id: string,
	): Promise<void> {
		await db.query(
			`
				INSERT INTO "core_guildInfo" ("id", "allowed")
				VALUES ($1, TRUE)
				ON CONFLICT ("id") DO UPDATE SET
					"allowed" = TRUE,
					"deleteAt" = NULL
			`,
			[id],
		);
	}

	export async function markNotAllowed(db: Pool, id: string): Promise<void> {
		await db.query(
			`
				UPDATE "core_guildInfo"
				SET "allowed" = FALSE
				WHERE "id" = $1
			`,
			[id],
		);
	}

	export async function scheduleDeletion(
		db: Pool,
		id: string,
	): Promise<Date | null> {
		const date = new Date();
		date.setDate(date.getDate() + 30);

		const result = await db.query(
			`
				UPDATE "core_guildInfo"
				SET
					"allowed" = FALSE,
					"deleteAt" = $2
				WHERE
					"id" = $1
					AND "deleteAt" IS NULL
			`,
			[id, date],
		);

		if (result.rowCount !== 0) {
			return date;
		} else {
			return null;
		}
	}

	export async function cancelDeletion(db: Pool, id: string): Promise<void> {
		await db.query(
			`
				UPDATE "core_guildInfo"
				SET "deleteAt" = NULL
				WHERE "id" = $1
			`,
			[id],
		);
	}

	export async function remove(db: Pool, id: string): Promise<void> {
		await db.query(
			`
			DELETE FROM "core_guildInfo"
			WHERE "id" = $1
		`,
			[id],
		);
	}

	// TODO: use this darn thing!
	export async function deleteExpired(db: Pool): Promise<number> {
		const result = await db.query(
			`
				DELETE FROM "core_guildInfo"
				WHERE "deleteAt" <= $1
			`,
			[new Date()],
		);

		return result.rowCount ?? 0;
	}
}
