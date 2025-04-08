import AsyncLock from "async-lock";
import { array, boolean, date, enum_, nullable, number, object, string, type InferOutput } from "valibot";
import { db_parse, pool } from "../index.ts";

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


export function case_type_by_id(id: string): CaseType | undefined {
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

export function case_type_id(type: CaseType): string {
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

export const case_info_schema = object({
	guild_id: string(),
	number: number(),

	type: enum_(CaseType),
	created_at: date(),
	expires_at: nullable(date()),

	actor_id: string(),
	target_id: string(),

	reason: nullable(string()),

	delete_message_seconds: nullable(number()),
	dm_sent: nullable(boolean())
});
export const case_info_array_schema = array(case_info_schema);

export interface CaseInfo extends InferOutput<typeof case_info_schema> { }

export interface CreateCaseOptions {
	type: CaseType;
	created_at?: Date;
	expires_at?: Date;

	actor_id: string;
	target_id: string;

	reason?: string;

	delete_message_seconds?: number;
	dm_delivered?: boolean;
}

export interface CaseQuery {
	number_less_than?: number;
	number_greater_than?: number;
	types?: CaseType[];
	created_before?: Date;
	created_after?: Date;
	expires_before?: Date;
	expires_after?: Date;

	actor_ids?: string[];
	target_ids?: string[];

	delete_message_seconds_less_than?: number;
	delete_message_seconds_greater_than?: number;
	dm_delivered?: boolean;

	reversed?: boolean;
	limit?: number;
}

// ensure number incrementation is atomic
const create_case_lock = new AsyncLock;

export async function get_case(guild_id: string, number: number): Promise<CaseInfo | null> {
	if (number < 0 || number >= 2 ** 32)
		return null;

	const result = await pool.query(
		`
			SELECT
				"guild_id",
				"number",
				"type",
				"created_at",
				"expires_at",
				"actor_id",
				"target_id",
				"reason",
				"delete_message_seconds",
				"dm_sent"
			FROM "moderation_cases"
			WHERE "guild_id" = $1
			AND "number" = $2
		`,
		[guild_id, number]
	);

	if (result.rowCount !== 1)
		return null;

	return db_parse(case_info_schema, result.rows[0]);
}

export async function get_cases(guild_id: string, query: CaseQuery): Promise<CaseInfo[]> {
	query.reversed ??= false;

	const result = await pool.query(
		`
			SELECT
				"guild_id",
				"number",
				"type",
				"created_at",
				"expires_at",
				"actor_id",
				"target_id",
				"reason",
				"delete_message_seconds",
				"dm_sent"
			FROM "moderation_cases"
			WHERE "guild_id" = $1
			AND (
				("number" < $2 OR $2 IS NULL)
				AND ("number" > $3 OR $3 IS NULL)
				AND ("type" = ANY($4) OR $4 IS NULL)
				AND ("created_at" < $5 OR $5 IS NULL)
				AND ("created_at" > $6 OR $6 IS NULL)
				AND ("expires_at" < $7 OR $7 IS NULL)
				AND ("expires_at" > $8 OR $8 IS NULL)
				AND ("actor_id" = ANY($9) OR $9 IS NULL)
				AND ("target_id" = ANY($10) OR $10 IS NULL)
				AND ("delete_message_seconds" < $11 OR $11 IS NULL)
				AND ("delete_message_seconds" > $12 OR $12 IS NULL)
				AND ("dm_sent" = $13 OR $13 IS NULL)
			)
			ORDER BY (CASE WHEN $14 THEN -"number" ELSE "number" END) ASC
			LIMIT $15
		`,
		[
			guild_id,
			query.number_less_than,
			query.number_greater_than,
			query.types,
			query.created_before,
			query.created_after,
			query.expires_before,
			query.expires_after,
			query.actor_ids,
			query.target_ids,
			query.delete_message_seconds_less_than,
			query.delete_message_seconds_greater_than,
			query.dm_delivered,
			query.reversed,
			query.limit,
		]
	);

	return db_parse(case_info_array_schema, result.rows);
}

export async function create_case(guild_id: string, options: CreateCaseOptions): Promise<number> {
	options.created_at ??= new Date;

	return await create_case_lock.acquire(guild_id, async () => {
		let number = (await pool.query(
			`
				SELECT "number"
				FROM "moderation_cases"
				WHERE "guild_id" = $1
				ORDER BY "number" DESC
				LIMIT 1
			`,
			[guild_id]
		)).rows[0]?.number ?? 0;
		++number;

		await pool.query(
			`
				INSERT INTO "moderation_cases" (
					"guild_id",
					"number",
					"type",
					"created_at",
					"expires_at",
					"actor_id",
					"target_id",
					"reason",
					"delete_message_seconds",
					"dm_sent"
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			`,
			[
				guild_id,
				number,
				options.type,
				options.created_at ?? null,
				options.expires_at ?? null,
				options.actor_id,
				options.target_id,
				options.reason ?? null,
				options.delete_message_seconds ?? null,
				options.dm_delivered ?? null,
			]
		);

		return number;
	});
}

