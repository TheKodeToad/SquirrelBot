import { dbParse, sqlite } from "#storage/index.ts";
import { z } from "zod/v4";

const JustValueSchema = z.strictObject({ value: z.string() });

export function getGuildConfig(guildID: string, pluginID: string): string | null {
	const result = sqlite.prepare(
		`
			SELECT "value"
			FROM "core_guildConfigs"
			WHERE "guildID" = ? AND "pluginID" = ?
		`
	).get(guildID, pluginID);

	if (result === undefined)
		return null;

	return dbParse(JustValueSchema, result).value;
}

export async function insertGuildConfig(guildID: string, pluginID: string, value: string): Promise<boolean> {
	const result = sqlite.prepare(
		`
			INSERT INTO "core_guildConfigs" (
				"guildID",
				"pluginID",
				"value"
			)
			VALUES (?, ?, ?)
			ON CONFLICT ("guildID", "pluginID") DO NOTHING
		`
	).run(guildID, pluginID, value);

	return result.changes === 1;
}

export async function updateGuildConfig(guildID: string, pluginID: string, value: string): Promise<boolean> {
	const result = sqlite.prepare(
		`
			UPDATE "core_guildConfigs"
			SET "value" = ?
			WHERE "guildID" = ? AND "pluginID" = ?
		`
	).run(value, guildID, pluginID);

	return result.changes === 1;
}

export async function upsertGuildConfig(guildID: string, pluginID: string, value: string): Promise<void> {
	sqlite.prepare(
		`
			INSERT INTO "core_guildConfigs" (
				"guildID",
				"pluginID",
				"value"
			)
			VALUES ($guildID, $pluginID, $value)
			ON CONFLICT ("guildID", "pluginID")
			DO UPDATE SET "value" = $value
		`
	).run({ guildID, pluginID, value });
}
