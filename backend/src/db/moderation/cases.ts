import { array, boolean, date, enum_, nullable, number, object, string, type InferOutput } from "valibot";
import { dbParse, pool } from "../index.ts";

export enum CaseType {
	// explicit numbering to allow reordering in source without breakage
	Note = 0,
	Warn = 1,
	Unwarn = 2,
	VoiceMute = 3,
	VoiceUnmute = 4,
	Mute = 5,
	Unmute = 6,
	Kick = 7,
	Ban = 8,
	Unban = 9,
}

export function caseTypeByID(id: string): CaseType | undefined {
	switch (id) {
		case "note": return CaseType.Note;
		case "warn": return CaseType.Warn;
		case "unwarn": return CaseType.Unwarn;
		case "voice_mute": return CaseType.VoiceMute;
		case "voice_unmute": return CaseType.VoiceUnmute;
		case "mute": return CaseType.Mute;
		case "unmute": return CaseType.Unmute;
		case "kick": return CaseType.Kick;
		case "ban": return CaseType.Ban;
		default: return undefined;
	}
}

export function caseTypeID(type: CaseType): string {
	switch (type) {
		case CaseType.Note: return "note";
		case CaseType.Warn: return "warn";
		case CaseType.Unwarn: return "unwarn";
		case CaseType.VoiceMute: return "voice_mute";
		case CaseType.VoiceUnmute: return "voice_unmute";
		case CaseType.Mute: return "mute";
		case CaseType.Unmute: return "unmute";
		case CaseType.Kick: return "kick";
		case CaseType.Ban: return "ban";
		case CaseType.Unban: return "unban";
	}
}

export function caseReverseType(type: CaseType): CaseType | null {
	switch (type) {
		case CaseType.Note: return null;
		case CaseType.Warn: return CaseType.Unwarn;
		case CaseType.Unwarn: return CaseType.Warn;
		case CaseType.VoiceMute: return CaseType.VoiceUnmute;
		case CaseType.VoiceUnmute: return CaseType.VoiceMute;
		case CaseType.Mute: return CaseType.Unmute;
		case CaseType.Unmute: return CaseType.Mute;
		case CaseType.Kick: return null;
		case CaseType.Ban: return CaseType.Unban;
		case CaseType.Unban: return CaseType.Ban;
	}
}

export const caseInfoSchema = object({
	guildID: string(),
	number: number(),

	type: enum_(CaseType),
	createdAt: date(),
	expiresAt: nullable(date()),
	shadowedBy: nullable(number()),

	actorID: string(),
	targetID: string(),

	reason: nullable(string()),

	deleteMessageSeconds: nullable(number()),
	dmDelivered: nullable(boolean())
});
export const caseInfoArraySchema = array(caseInfoSchema);

export interface CaseInfo extends InferOutput<typeof caseInfoSchema> { }

export interface CreateCaseOptions {
	type: CaseType;
	createdAt?: Date;
	expiresAt?: Date;

	actorID: string;
	targetID: string;

	reason?: string;

	deleteMessageSeconds?: number;
	dmDelivered?: boolean;
}

export interface CaseQuery {
	numberLessThan?: number;
	numberGreaterThan?: number;

	types?: CaseType[];
	createdBefore?: Date;
	createdAfter?: Date;
	expiresBefore?: Date;
	expiresAfter?: Date;

	actorIDs?: string[];
	targetIDs?: string[];

	deleteMessageSecondsLessThan?: number;
	deleteMessageSecondsGreaterThan?: number;
	dmDelivered?: boolean;

	reversed: boolean;
	limit: number;
}

export async function getCase(guildID: string, number: number): Promise<CaseInfo | null> {
	if (number < 0 || number >= 2 ** 32)
		return null;

	const result = await pool.query(
		`
			SELECT *
			FROM "moderation_cases"
			WHERE "guildID" = $1
			AND "number" = $2
		`,
		[guildID, number]
	);

	if (result.rowCount !== 1)
		return null;

	return dbParse(caseInfoSchema, result.rows[0]);
}

export async function getCases(guildID: string, query: CaseQuery): Promise<CaseInfo[]> {
	query.reversed ??= false;

	const result = await pool.query(
		`
			SELECT *
			FROM "moderation_cases"
			WHERE "guildID" = $1
			AND (
				("number" < $2 OR $2 IS NULL)
				AND ("number" > $3 OR $3 IS NULL)
				AND ("type" = ANY($4) OR $4 IS NULL)
				AND ("createdAt" < $5 OR $5 IS NULL)
				AND ("createdAt" > $6 OR $6 IS NULL)
				AND ("expiresAt" < $7 OR $7 IS NULL)
				AND ("expiresAt" > $8 OR $8 IS NULL)
				AND ("actorID" = ANY($9) OR $9 IS NULL)
				AND ("targetID" = ANY($10) OR $10 IS NULL)
				AND ("deleteMessageSeconds" < $11 OR $11 IS NULL)
				AND ("deleteMessageSeconds" > $12 OR $12 IS NULL)
				AND ("dmDelivered" = $13 OR $13 IS NULL)
			)
			ORDER BY (CASE WHEN $14 THEN -"number" ELSE "number" END) ASC
			LIMIT $15
		`,
		[
			guildID,
			query.numberLessThan,
			query.numberGreaterThan,
			query.types,
			query.createdBefore,
			query.createdAfter,
			query.expiresBefore,
			query.expiresAfter,
			query.actorIDs,
			query.targetIDs,
			query.deleteMessageSecondsLessThan,
			query.deleteMessageSecondsGreaterThan,
			query.dmDelivered,
			query.reversed,
			query.limit,
		]
	);

	return dbParse(caseInfoArraySchema, result.rows);
}

export async function createCase(guildID: string, options: CreateCaseOptions): Promise<number> {
	options.createdAt ??= new Date;

	const client = await pool.connect();

	let done = false;

	try {
		await client.query("BEGIN");

		const result = await client.query(
			`
				INSERT INTO "moderation_cases" (
					"guildID",
					"type",
					"createdAt",
					"expiresAt",
					"actorID",
					"targetID",
					"reason",
					"deleteMessageSeconds",
					"dmDelivered"
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
				RETURNING "number"
			`,
			[
				guildID,
				options.type,
				options.createdAt ?? null,
				options.expiresAt ?? null,
				options.actorID,
				options.targetID,
				options.reason ?? null,
				options.deleteMessageSeconds ?? null,
				options.dmDelivered ?? null,
			]
		);
		const newNumber = dbParse(number(), result.rows[0].number);

		const reverseType = caseReverseType(options.type);

		if (reverseType !== null) {
			await client.query(
				`
					WITH "shadowed" AS (
						SELECT "guildID", "number"
						FROM "moderation_cases"
						WHERE
							"number" != $1
							AND ("type" = $2 OR "type" = $3)
							AND ("expiresAt" IS NULL OR "expiresAt" > $4)
						ORDER BY "number" DESC
						LIMIT 1
					)
					UPDATE "moderation_cases"
					SET "shadowedBy" = $1
					FROM "shadowed"
					WHERE
						"moderation_cases"."guildID" = "shadowed"."guildID"
						AND "moderation_cases"."number" = "shadowed"."number"
				`,
				[newNumber, options.type, reverseType, new Date]
			);
		}

		await client.query("COMMIT");
		done = true;

		return newNumber;
	} finally {
		if (!done)
			await client.query("ROLLBACK");

		client.release();
	}
}

export async function deleteCase(guildID: string, number: number): Promise<boolean> {
	if (number < 0 || number >= 2 ** 32)
		return false;

	const result = await pool.query(
		`
			DELETE FROM "moderation_cases"
			WHERE "guildID" = $1 AND "number" = $2
		`,
		[guildID, number]
	);

	return result.rowCount === 1;
}
