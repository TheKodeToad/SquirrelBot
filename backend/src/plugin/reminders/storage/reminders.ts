import { dbParse, sqlite } from "#storage/index.ts";
import { ChannelTypes } from "oceanic.js";
import { z } from "zod/v4";

const Reminder = z.strictObject({
	guildID: z.string(),
	number: z.number(),

	ownerID: z.string(),
	channelID: z.string(),
	channelType: z.enum(ChannelTypes),

	createdAt: z.date(),
	firesAt: z.date(),

	message: z.string().nullable(),
	silent: z.boolean(),
});

const ReminderArray = Reminder.array();

export interface Reminder extends z.output<typeof Reminder> { }

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

const JustCounter = z.strictObject({ counter: z.number() });

export function getReminder(guildID: string, number: number): Reminder | null {
	if (number < 0 || number >= 2 ** 32)
		return null;

	const result = sqlite.prepare(
		`
			SELECT * FROM "reminders_reminders"
			WHERE
				"guildID" = ?
				AND "number" = ?
		`
	).get(guildID, number);

	if (result === undefined)
		return null;

	return dbParse(Reminder, result);
}

export function getReminders(guildID: string, query: ReminderQuery): Reminder[] {
	const result = sqlite.prepare(
		`
			SELECT * FROM "reminders_reminders"
			WHERE
				"guildID" = $guildID
				AND ("ownerID" = $ownerID OR $ownerID IS NULL)
				AND ("channelID" = $channelID OR $channelID IS NULL)
				AND ("firesAt" < $firesBefore OR $firesBefore IS NULL)
				AND ("firesAt" > $firesAfter OR $firesAfter IS NULL)
			ORDER BY
				(CASE WHEN $reversed THEN "firesAt" END) DESC,
				(CASE WHEN NOT $reversed THEN "firesAt" END) ASC
			LIMIT $limit
		`
	).all({ guildID, ...query });

	return dbParse(ReminderArray, result);
}

export function getRemindersByFiresAt(startInclusive: Date, endExclusive: Date): Reminder[] {
	const result = sqlite.prepare(
		`
			SELECT *
			FROM "reminders_reminders"
			WHERE "firesAt" >= ? AND "firesAt" < ?
		`
	).all(startInclusive, endExclusive);

	return dbParse(ReminderArray, result);
}

export const createReminder = sqlite.transaction((guildID: string, options: CreateReminderOptions): number => {
	const counterResult = sqlite.prepare(
		`
			INSERT INTO "reminders_" ("guildID", "counter")
			VALUES (?, 1)
			ON CONFLICT ("guildID")
			DO UPDATE SET "counter" = "moderation_caseNumberCounter"."counter" + 1
			RETURNING "counter"
		`
	).get(guildID);

	const newNumber = dbParse(JustCounter, counterResult).counter;

	options.createdAt ??= new Date;

	sqlite.prepare(
		`
			INSERT INTO "reminders_reminders" (
				"number",
				"guildID",
				"ownerID",
				"channelID",
				"channelType",
				"createdAt",
				"firesAt",
				"message",
				"silent"
			)
			VALUES (
				$newNumber,
				$guildID,
				$ownerID,
				$channelID,
				$channelType,
				$createdAt,
				$firesAt,
				$message,
				$silent
			)
			RETURNING "number"
		`
	).run({ newNumber, guildID, ...options });

	return newNumber;
});

export function deleteReminder(guildID: string, number: number): boolean {
	const result = sqlite.prepare(
		`
			DELETE FROM "reminders_reminders"
			WHERE "guildID" = ? AND "number" = ?
		`
	).run(guildID, number);

	return result.changes === 1;
}
