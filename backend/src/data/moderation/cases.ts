import AsyncLock from "async-lock";
import { database } from "..";

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

export const CASE_TYPE_ID_TO_NAME: Record<CaseType, string> = {
	[CaseType.Note]: "note",
	[CaseType.Warn]: "warn",
	[CaseType.Unwarn]: "unwarn",
	[CaseType.VoiceMute]: "voice_mute",
	[CaseType.VoiceUnmute]: "voice_unmute",
	[CaseType.Mute]: "mute",
	[CaseType.Unmute]: "unmute",
	[CaseType.Kick]: "kick",
	[CaseType.Ban]: "ban",
	[CaseType.Unban]: "unban"
};

export const CASE_TYPE_NAME_TO_ID: Record<string, CaseType> = {};

for (const [type, name] of Object.entries(CASE_TYPE_ID_TO_NAME))
	CASE_TYPE_NAME_TO_ID[name] = Number(type); // we don't talk about it

export interface CaseInfo {
	guild_id: string;
	number: number;

	type: CaseType;
	created_at: Date;
	expires_at: Date | null;

	actor_id: string;
	target_id: string;

	reason: string | null;

	delete_message_seconds: number | null;
	dm_sent: boolean | null;
}

export interface CreateCaseOptions {
	type: CaseType;
	created_at?: Date;
	expires_at?: Date;

	actor_id: string;
	target_id: string;

	reason?: string;

	delete_message_seconds?: number;
	dm_sent?: boolean;
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
	dm_sent?: boolean;

	reversed?: boolean;
	limit?: number;
}

// ensure number incrementation is atomic
const create_case_lock = new AsyncLock;

export async function get_case(guild_id: string, number: number): Promise<CaseInfo | null> {
	if (number < 0 || number >= 2 ** 32)
		return null;

	const result = await database.query(
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

	return result.rows[0] ?? null;
}

export async function get_cases(guild_id: string, query: CaseQuery): Promise<CaseInfo[]> {
	query.reversed ??= false;

	const result = await database.query(
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
				"delete_message_seconds"
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
			query.dm_sent,
			query.reversed,
			query.limit,
		]
	);

	return result.rows;
}

export async function create_case(guild_id: string, options: CreateCaseOptions): Promise<number> {
	options.created_at ??= new Date;

	return await create_case_lock.acquire(guild_id, async () => {
		let number = (await database.query(
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

		await database.query(
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
				options.dm_sent ?? null,
			]
		);

		return number;
	});
}

