import { dbParse } from "#storage/index.ts";
import type { Pool } from "pg";
import z from "zod/v4";

const TempBan = z.object({
	guildID: z.string(),
	targetID: z.string(),

	endsAt: z.date(),
	caseNumber: z.number(),
});
const TempBanArray = TempBan.array();

export type TempBan = z.output<typeof TempBan>;

export interface CreateTimerOptions {
	targetID: string;

	endsAt: Date;
	caseNumber?: number;
}

export async function getTempBansByEndsAt(db: Pool, startInclusive: Date, endExclusive: Date): Promise<TempBan[]> {
	const result = await db.query(
		`
			SELECT *
			FROM "moderation_tempBans"
			WHERE "endsAt" >= $1 AND "endsAt" < $2
		`,
		[startInclusive, endExclusive]
	);

	return dbParse(TempBanArray, result.rows);
}

export async function upsertTempBan(db: Pool, guildID: string, options: CreateTimerOptions): Promise<void> {
	await db.query(
		`
			INSERT INTO "moderation_tempBans" (
				"guildID",
				"targetID",
				"endsAt",
				"caseNumber"
			)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT ("guildID", "targetID")
			DO UPDATE SET "endsAt" = $3, "caseNumber" = $4

		`,
		[guildID, options.targetID, options.endsAt, options.caseNumber]
	)
}

export async function deleteTempBan(db: Pool, guildID: string, targetID: string): Promise<boolean> {
	const result = await db.query(
		`
			DELETE FROM "moderation_tempBans"
			WHERE
				"guildID" = $1
				AND "targetID" = $2
		`,
		[guildID, targetID]
	)

	return result.rowCount === 1;
}
