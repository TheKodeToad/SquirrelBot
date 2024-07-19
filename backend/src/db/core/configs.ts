import { pool } from "..";

export async function get_guild_config(guild_id: string, key: string): Promise<string | null> {
	const result = await pool.query(
		`
			SELECT "value"
			FROM "core_guild_configs"
			WHERE "guild_id" = $1 AND "key" = $2
		`,
		[guild_id, key]
	);

	return result.rows[0]?.value ?? null;
}

export async function insert_guild_config(guild_id: string, key: string, value: string): Promise<boolean> {
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
		[guild_id, key, value]
	);

	return result.rowCount === 1;
}

export async function update_guild_config(guild_id: string, key: string, value: string): Promise<boolean> {
	const result = await pool.query(
		`
			UPDATE "core_guild_configs"
			SET "value" = $3
			WHERE "guild_id" = $1 AND "key" = $2
		`,
		[guild_id, key, value]
	);

	return result.rowCount === 1;
}

export async function upsert_guild_config(guild_id: string, key: string, value: string): Promise<void> {
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
		[guild_id, key, value]
	);
}
