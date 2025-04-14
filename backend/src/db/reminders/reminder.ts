import AsyncLock from "async-lock";
import { array, boolean, date, nullable, number, object, string, type InferOutput } from "valibot";
import { dbParse, pool } from "../index.ts";

const reminderSchema = object({
	guildID: string(),
	number: number(),

	ownerID: string(),
	channelID: string(),

	createdAt: date(),
	firesAt: date(),

	message: nullable(string()),
	silent: boolean(),
});

const reminderArraySchema = array(reminderSchema);

export interface Reminder extends InferOutput<typeof reminderSchema> { }

export interface CreateReminderOptions {
	ownerID: string;
	channelID: string;

	createdAt: Date;
	firesAt: Date;

	message: string | null;
	silent: boolean;
}

export async function getReminder(guildID: string, number: number): Promise<Reminder | null> {
	if (number < 0 || number >= 2 ** 32)
		return null;

	const result = await pool.query(
		`
			SELECT
				"guildID",
				"number",
				"ownerID",
				"channelID",
				"createdAt",
				"firesAt",
				"message",
				"silent"
			FROM "reminders_reminders"
			WHERE
				"guildID" = $1
				AND "number" = $2
		`,
		[guildID, number]
	);

	if (result.rowCount !== 1)
		return null;

	return dbParse(reminderSchema, result.rows[0]);
}

export async function getRemindersByFiresAt(startInclusive: Date, endExclusive: Date): Promise<Reminder[]> {
	const result = await pool.query(
		`
			SELECT
				"guildID",
				"number",
				"ownerID",
				"channelID",
				"createdAt",
				"firesAt",
				"message",
				"silent"
			FROM "reminders_reminders"
			WHERE "firesAt" >= $1 AND "firesAt" < $2
		`,
		[startInclusive, endExclusive]
	);

	return dbParse(reminderArraySchema, result.rows);
}

const createDeleteReminderLock = new AsyncLock;

export async function createReminder(guildID: string, options: CreateReminderOptions): Promise<Reminder> {
	options.createdAt ??= new Date;

	return await createDeleteReminderLock.acquire(guildID, async () => {
		let number = (await pool.query(
			`
				SELECT "number"
				FROM "reminders_reminders"
				WHERE "guildID" = $1
				ORDER BY "number" DESC
				LIMIT 1
			`,
			[guildID]
		)).rows[0]?.number ?? 0;
		++number;

		const result = await pool.query(
			`
				INSERT INTO "reminders_reminders" (
					"guildID",
					"number",
					"ownerID",
					"channelID",
					"createdAt",
					"firesAt",
					"message",
					"silent"
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			`,
			[
				guildID,
				number,
				options.ownerID,
				options.channelID,
				options.createdAt,
				options.firesAt,
				options.message ?? null,
				options.silent,
			]
		);

		return {
			guildID,
			number,
			...options
		} satisfies Reminder;
	});
}

export async function deleteReminder(guildID: string, number: number) {
	return await createDeleteReminderLock.acquire(guildID, async () => {

		await pool.query(
			`
				DELETE FROM "reminders_reminders"
				WHERE "guildID" = $1 AND "number" = $2
			`,
			[guildID, number]
		);

		return number;
	});
}