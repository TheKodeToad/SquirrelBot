import { dbParse } from "#storage/index.ts";
import type { Pool } from "pg";
import { z } from "zod";

const JustValueSchema = z.strictObject({ value: z.string() });

export async function getGuildConfig(db: Pool, guildID: string, pluginID: string): Promise<string | null> {
	const result = await db.query(
		`
			SELECT "value"
			FROM "core_guildConfigs"
			WHERE "guildID" = $1 AND "pluginID" = $2
		`,
		[guildID, pluginID]
	);

	if (result.rowCount !== 1)
		return null;

	return dbParse(JustValueSchema, result.rows[0]).value;
}

export async function insertGuildConfig(db: Pool, guildID: string, pluginID: string, value: string): Promise<boolean> {
	const result = await db.query(
		`
			INSERT INTO "core_guildConfigs" (
				"guildID",
				"pluginID",
				"value"
			)
			VALUES ($1, $2, $3)
			ON CONFLICT ("guildID", "pluginID") DO NOTHING
		`,
		[guildID, pluginID, value]
	);

	return result.rowCount === 1;
}

export async function updateGuildConfig(db: Pool, guildID: string, pluginID: string, value: string): Promise<boolean> {
	const result = await db.query(
		`
			UPDATE "core_guildConfigs"
			SET "value" = $3
			WHERE "guildID" = $1 AND "pluginID" = $2
		`,
		[guildID, pluginID, value]
	);

	return result.rowCount === 1;
}

export async function upsertGuildConfig(db: Pool, guildID: string, pluginID: string, value: string): Promise<void> {
	await db.query(
		`
			INSERT INTO "core_guildConfigs" (
				"guildID",
				"pluginID",
				"value"
			)
			VALUES ($1, $2, $3)
			ON CONFLICT ("guildID", "pluginID")
			DO UPDATE SET "value" = $3
		`,
		[guildID, pluginID, value]
	);
}
