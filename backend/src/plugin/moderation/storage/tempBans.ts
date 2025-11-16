import { dbParse, sqlite } from "#storage/index.ts";
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

export function getTempBansByEndsAt(startInclusive: Date, endExclusive: Date): TempBan[] {
	const result = sqlite.prepare(
		`
			SELECT *
			FROM "moderation_tempBans"
			WHERE "endsAt" >= ? AND "endsAt" < ?
		`
	).all(startInclusive, endExclusive);

	return dbParse(TempBanArray, result);
}

export function upsertTempBan(guildID: string, options: CreateTimerOptions): void {
	sqlite.prepare(
		`
			INSERT INTO "moderation_tempBans" (
				"guildID",
				"targetID",
				"endsAt",
				"caseNumber"
			)
			VALUES ($guildID, $targetID, $endsAt, $caseNumber)
			ON CONFLICT ("guildID", "targetID")
			DO UPDATE SET "endsAt" = $endsAt, "caseNumber" = $caseNumber

		`
	).run({ guildID: guildID, options });
}

export function deleteTempBan(guildID: string, targetID: string): boolean {
	const result = sqlite.prepare(
		`
			DELETE FROM "moderation_tempBans"
			WHERE
				"guildID" = ?
				AND "targetID" = ?
		`
	).run(guildID, targetID);

	return result.changes === 1;
}
