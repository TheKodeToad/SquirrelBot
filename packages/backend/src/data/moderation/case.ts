import AsyncLock from "async-lock";
import { database } from "..";

export enum CaseType {
	// explicit numbering to allow reordering in source without breakage
	NOTE = 0,
	WARN = 1,
	UNWARN = 2,
	VOICE_MUTE = 3,
	VOICE_UNMUTE = 4,
	MUTE = 5,
	UNMUTE = 6,
	KICK = 7,
	BAN = 8,
	UNBAN = 9,
}

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

// ensure number incrementation is atomic
const create_case_lock = new AsyncLock;

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

export async function get_cases(guild_id: string, actor_id?: string, target_id?: string, limit?: number): Promise<CaseInfo[]> {
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
			AND ("actor_id" = $2 OR $2 IS NULL)
			AND ("target_id" = $3 OR $3 IS NULL)
			ORDER BY "number" DESC
			LIMIT $4
		`,
		[guild_id, actor_id ?? null, target_id ?? null, limit ?? null]
	);

	return result.rows;
}
