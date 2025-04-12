import { string } from "valibot";
import { dbParse, pool } from "../index.ts";

export async function getGuildConfig(guildID: string, key: string): Promise<string | null> {
	const result = await pool.query(
		`
			SELECT "value"
			FROM "core_guild_configs"
			WHERE "guild_id" = $1 AND "key" = $2
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
			INSERT INTO "core_guild_configs" (
				"guild_id",
				"key",
				"value"
			)
			VALUES ($1, $2, $3)
			ON CONFLICT ("guild_id", "key") DO NOTHING
		`,
		[guildID, key, value]
	);

	return result.rowCount === 1;
}

export async function updateGuildConfig(guildID: string, key: string, value: string): Promise<boolean> {
	const result = await pool.query(
		`
			UPDATE "core_guild_configs"
			SET "value" = $3
			WHERE "guild_id" = $1 AND "key" = $2
		`,
		[guildID, key, value]
	);

	return result.rowCount === 1;
}

export async function upsertGuildConfig(guildID: string, key: string, value: string): Promise<void> {
	await pool.query(
		`
			INSERT INTO "core_guild_configs" (
				"guild_id",
				"key",
				"value"
			)
			VALUES ($1, $2, $3)
			ON CONFLICT ("guild_id", "key")
			DO UPDATE SET "value" = $3
		`,
		[guildID, key, value]
	);
}
