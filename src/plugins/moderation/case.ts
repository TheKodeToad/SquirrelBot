import AsyncLock from "async-lock";
import { pg } from "../..";

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

export interface CreateCaseOptions {
	type: CaseType;
	created_at?: Date;
	expires_at?: Date;

	actor_id: string;
	target_id: string;

	reason?: string;
}

// ensure number incrementation is atomic
const create_case_lock = new AsyncLock;

export async function create_case(guild_id: string, options: CreateCaseOptions): Promise<number> {
	options.created_at ??= new Date;

	return await create_case_lock.acquire(guild_id, async () => {
		let number = (await pg.query(
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

		await pg.query(
			`
				INSERT INTO "moderation_cases" (
					"guild_id",
					"number",
					"type",
					"created_at",
					"expires_at",
					"actor_id",
					"target_id",
					"reason"
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			`,
			[
				guild_id,
				number,
				options.type,
				options.created_at ?? null,
				options.expires_at ?? null,
				options.actor_id,
				options.target_id,
				options.reason ?? null
			]
		);

		return number;
	});
}
