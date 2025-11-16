import { dbParse, sqlite } from "#storage/index.ts";
import { z } from "zod/v4";
import { ModEventType, reverseModEventType, type ModEvent } from "../public/modEvent.ts";

export const CaseInfo = z.strictObject({
	guildID: z.string(),
	number: z.number(),

	type: z.enum(ModEventType),
	createdAt: z.date(),
	expiresAt: z.date().nullable(),
	shadowedBy: z.number().nullable(),
	reversed: z.boolean(),

	actorID: z.string(),
	targetID: z.string(),

	reason: z.string().nullable(),

	deleteMessageSeconds: z.number().nullable(),
	dmDelivered: z.boolean().nullable(),
});
export const CaseInfoArray = CaseInfo.array();

export interface CaseInfo extends z.output<typeof CaseInfo> { }

export interface CaseQuery {
	numberLessThan?: number;
	numberGreaterThan?: number;

	types?: ModEventType[];
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

const JustCounter = z.strictObject({ counter: z.number() });

export function getCase(guildID: string, number: number): CaseInfo | null {
	if (number < 0 || number >= 2 ** 32)
		return null;

	const result = sqlite.prepare(
		`
			SELECT *
			FROM "moderation_cases"
			WHERE "guildID" = $1
			AND "number" = $2
		`
	).get(guildID, number);

	if (result === undefined)
		return null;

	return dbParse(CaseInfo, result);
}

export function getCases(guildID: string, query: CaseQuery): CaseInfo[] {
	query.reversed ??= false;

	const result = sqlite.prepare(
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
		`
	).get(
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
	);

	return dbParse(CaseInfoArray, result);
}

export const createCase = sqlite.transaction((guildID: string, event: ModEvent): number => {
	const counterResult = sqlite.prepare(
		`
			INSERT INTO "moderation_caseNumberCounter" ("guildID", "counter")
			VALUES (?, 1)
			ON CONFLICT ("guildID")
			DO UPDATE SET "counter" = "moderation_caseNumberCounter"."counter" + 1
			RETURNING "counter"
		`
	).get(guildID);

	const newNumber = dbParse(JustCounter, counterResult).counter;

	sqlite.prepare(
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
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			RETURNING "number"
		`,
	).run(
		guildID,
		event.type,
		event.performedAt,
		event.expiresAt ?? null,
		event.actor.id,
		event.target.id,
		event.reason ?? null,
		event.deleteMessageSeconds ?? null,
		event.dmDelivered ?? null,
	);

	const reverseType = reverseModEventType(event.type);

	if (reverseType !== null) {
		sqlite.prepare(
			`
				WITH "shadowed" AS (
					SELECT "guildID", "number"
					FROM "moderation_cases"
					WHERE
						"number" != $newNumber
						AND ("targetID" = $targetID)
						AND ("type" = $type OR "type" = $reverseType)
						AND ("expiresAt" IS NULL OR "expiresAt" > $now)
					ORDER BY "number" DESC
					LIMIT 1
				)
				UPDATE "moderation_cases"
				SET
					"shadowedBy" = $newNumber,
					"reversed" = ("type" = $reverseType)
				FROM "shadowed"
				WHERE
					"moderation_cases"."guildID" = "shadowed"."guildID"
					AND "moderation_cases"."number" = "shadowed"."number"
			`
		).run(newNumber, event.target.id, event.type, reverseType, new Date);
	}

	return newNumber;
});

export function deleteCase(guildID: string, number: number): boolean {
	if (number < 0 || number >= 2 ** 32)
		return false;

	const result = sqlite.prepare(
		`
			DELETE FROM "moderation_cases"
			WHERE "guildID" = $1 AND "number" = $2
		`
	).run(guildID, number);

	return result.changes === 1;
}
