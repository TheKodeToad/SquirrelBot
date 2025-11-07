import { dbParse, postgres } from "#storage/index.ts";
import { z } from "zod/v4";
import { ModEventType, reverseModEventType, type ModEvent } from "../public/modEvent.ts";

export const CaseInfo = z.strictObject({
	guildID: z.string(),
	number: z.number(),

	type: z.enum(ModEventType),
	createdAt: z.date(),
	expiresAt: z.date().nullable(),
	shadowedBy: z.number().nullable(),

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

const JustNumber = z.strictObject({ number: z.number() });

export async function getCase(guildID: string, number: number): Promise<CaseInfo | null> {
	if (number < 0 || number >= 2 ** 32)
		return null;

	const result = await postgres.query(
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

	return dbParse(CaseInfo, result.rows[0]);
}

export async function getCases(guildID: string, query: CaseQuery): Promise<CaseInfo[]> {
	query.reversed ??= false;

	const result = await postgres.query(
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

	return dbParse(CaseInfoArray, result.rows);
}

export async function createCase(guildID: string, event: ModEvent): Promise<number> {
	// TODO: might have edge cases but it's pretty darn unlikely

	const client = await postgres.connect();

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
				event.type,
				event.performedAt,
				event.expiresAt ?? null,
				event.actor.id,
				event.target.id,
				event.reason ?? null,
				event.deleteMessageSeconds ?? null,
				event.dmDelivered ?? null,
			]
		);
		const newNumber = dbParse(JustNumber, result.rows[0]).number;

		const reverseType = reverseModEventType(event.type);

		if (!(reverseType === null || reverseType === ModEventType.Warn || reverseType === ModEventType.Unwarn)) {
			await client.query(
				`
					WITH "shadowed" AS (
						SELECT "guildID", "number"
						FROM "moderation_cases"
						WHERE
							"number" != $1
							AND ("targetID" = $2)
							AND ("type" = $3 OR "type" = $4)
							AND ("expiresAt" IS NULL OR "expiresAt" > $5)
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
				[newNumber, event.target.id, event.type, reverseType, new Date]
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

	const result = await postgres.query(
		`
			DELETE FROM "moderation_cases"
			WHERE "guildID" = $1 AND "number" = $2
		`,
		[guildID, number]
	);

	return result.rowCount === 1;
}
