import { ChannelTypes } from "oceanic.js";
import { array, boolean, date, enum_, nullable, number, object, string, type InferOutput } from "valibot";
import { dbParse, pool } from "../index.ts";

const reminderSchema = object({
	guildID: string(),
	number: number(),

	ownerID: string(),
	channelID: string(),
	channelType: enum_(ChannelTypes),

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
	channelType: ChannelTypes;

	createdAt: Date;
	firesAt: Date;

	message: string | null;
	silent: boolean;
}

export interface ReminderQuery {
	ownerID?: string;
	channelID?: string;

	firesBefore?: Date;
	firesAfter?: Date;

	reversed: boolean;
	limit: number;
}

const justNumberSchema = object({ number: number() });

export async function getReminder(guildID: string, number: number): Promise<Reminder | null> {
	if (number < 0 || number >= 2 ** 32)
		return null;

	const result = await pool.query(
		`
			SELECT * FROM "reminders_reminders"
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

export async function getReminders(guildID: string, query: ReminderQuery): Promise<Reminder[]> {
	const result = await pool.query(
		`
			SELECT * FROM "reminders_reminders"
			WHERE
				"guildID" = $1
				AND ("ownerID" = $2 OR $2 IS NULL)
				AND ("channelID" = $3 OR $3 IS NULL)
				AND ("firesAt" < $4 OR $4 IS NULL)
				AND ("firesAt" > $5 OR $5 IS NULL)
			ORDER BY
				(CASE WHEN $6 THEN "firesAt" END) DESC,
				(CASE WHEN NOT $6 THEN "firesAt" END) ASC
			LIMIT $7
		`,
		[
			guildID,
			query.ownerID,
			query.channelID,
			query.firesBefore,
			query.firesAfter,
			query.reversed,
			query.limit,
		]
	);

	return dbParse(reminderArraySchema, result.rows);
}

export async function getRemindersByFiresAt(startInclusive: Date, endExclusive: Date): Promise<Reminder[]> {
	const result = await pool.query(
		`
			SELECT *
			FROM "reminders_reminders"
			WHERE "firesAt" >= $1 AND "firesAt" < $2
		`,
		[startInclusive, endExclusive]
	);

	return dbParse(reminderArraySchema, result.rows);
}

export async function createReminder(guildID: string, options: CreateReminderOptions): Promise<Reminder> {
	options.createdAt ??= new Date;

	const result = await pool.query(
		`
			INSERT INTO "reminders_reminders" (
				"guildID",
				"ownerID",
				"channelID",
				"channelType",
				"createdAt",
				"firesAt",
				"message",
				"silent"
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING "number"
		`,
		[
			guildID,
			options.ownerID,
			options.channelID,
			options.channelType,
			options.createdAt,
			options.firesAt,
			options.message ?? null,
			options.silent,
		]
	);

	return {
		guildID,
		number: dbParse(justNumberSchema, result.rows[0]).number,
		...options
	} satisfies Reminder;
}

export async function deleteReminder(guildID: string, number: number): Promise<boolean> {
	const result = await pool.query(
		`
			DELETE FROM "reminders_reminders"
			WHERE "guildID" = $1 AND "number" = $2
		`,
		[guildID, number]
	);

	return result.rowCount === 1;
};
