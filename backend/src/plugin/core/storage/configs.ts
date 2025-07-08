import { dbParse, postgres } from "#storage/index.ts";
import { strictObject, string } from "valibot";

const justValueSchema = strictObject({ value: string() });

export async function getGuildConfig(guildID: string, pluginID: string): Promise<string | null> {
	const result = await postgres.query(
		`
			SELECT "value"
			FROM "core_guildConfigs"
			WHERE "guildID" = $1 AND "pluginID" = $2
		`,
		[guildID, pluginID]
	);

	if (result.rowCount !== 1)
		return null;

	return dbParse(justValueSchema, result.rows[0]).value;
}

export async function insertGuildConfig(guildID: string, pluginID: string, value: string): Promise<boolean> {
	const result = await postgres.query(
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

export async function updateGuildConfig(guildID: string, pluginID: string, value: string): Promise<boolean> {
	const result = await postgres.query(
		`
			UPDATE "core_guildConfigs"
			SET "value" = $3
			WHERE "guildID" = $1 AND "pluginID" = $2
		`,
		[guildID, pluginID, value]
	);

	return result.rowCount === 1;
}

export async function upsertGuildConfig(guildID: string, pluginID: string, value: string): Promise<void> {
	await postgres.query(
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
