import { string } from "valibot";
import { dbParse, pool } from "../index.ts";

export async function getGuildConfig(guildID: string, key: string): Promise<string | null> {
	const result = await pool.query(
		`
			SELECT "value"
			FROM "core_guildConfigs"
			WHERE "guildID" = $1 AND "key" = $2
		`,
		[guildID, key]
	);

	if (result.rowCount !== 1)
		return null;

	return dbParse(string(), result.rows[0]?.value);
}

export async function insertGuildConfig(guildID: string, key: string, value: string): Promise<boolean> {
	const result = await pool.query(
		`
			INSERT INTO "core_guildConfigs" (
				"guildID",
				"key",
				"value"
			)
			VALUES ($1, $2, $3)
			ON CONFLICT ("guildID", "key") DO NOTHING
		`,
		[guildID, key, value]
	);

	return result.rowCount === 1;
}

export async function updateGuildConfig(guildID: string, key: string, value: string): Promise<boolean> {
	const result = await pool.query(
		`
			UPDATE "core_guildConfigs"
			SET "value" = $3
			WHERE "guildID" = $1 AND "key" = $2
		`,
		[guildID, key, value]
	);

	return result.rowCount === 1;
}

export async function upsertGuildConfig(guildID: string, key: string, value: string): Promise<void> {
	await pool.query(
		`
			INSERT INTO "core_guildConfigs" (
				"guildID",
				"key",
				"value"
			)
			VALUES ($1, $2, $3)
			ON CONFLICT ("guildID", "key")
			DO UPDATE SET "value" = $3
		`,
		[guildID, key, value]
	);
}
