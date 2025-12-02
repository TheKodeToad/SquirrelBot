import { isSigned32 } from "#common/general.ts";
import { poolTransaction } from "#common/pg/transaction.ts";
import { dbParse } from "#storage/storage.ts";
import { ChannelTypes } from "oceanic.js";
import type { Pool } from "pg";
import { z } from "zod";

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
export type Reminder = z.output<typeof Reminder>;

export namespace remindersTable {
	export async function get(
		db: Pool,
		guildID: string,
		number: number,
	): Promise<Reminder | null> {
		if (!isSigned32(number)) {
			return null;
		}

		const result = await db.query(
			`
				SELECT * FROM "reminders_reminders"
				WHERE "guildID" = $1 AND "number" = $2
			`,
			[guildID, number],
		);

		if (result.rowCount !== 1) {
			return null;
		}

		return dbParse(Reminder, result.rows[0]);
	}

	export interface Query {
		ownerID?: string;
		channelID?: string;

		firesBefore?: Date;
		firesAfter?: Date;

		reversed: boolean;
		limit: number;
	}

	export async function allFiringBetween(
		db: Pool,
		startInclusive: Date,
		endExclusive: Date,
	): Promise<Reminder[]> {
		const result = await db.query(
			`
				SELECT *
				FROM "reminders_reminders"
				WHERE "firesAt" >= $1 AND "firesAt" < $2
			`,
			[startInclusive, endExclusive],
		);

		return dbParse(ReminderArray, result.rows);
	}

	export async function query(
		db: Pool,
		guildID: string,
		query: Query,
	): Promise<Reminder[]> {
		const result = await db.query(
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
			],
		);

		return dbParse(ReminderArray, result.rows);
	}

	const JustCounter = z.strictObject({ counter: z.number() });

	export function insert(
		db: Pool,
		reminder: Omit<Reminder, "number">,
	): Promise<number> {
		return poolTransaction(db, async (client) => {
			const result = await client.query(
				`
					INSERT INTO "reminders_reminderNumberCounter" ("guildID", "counter")
					VALUES ($1, 1)
					ON CONFLICT ("guildID")
					DO UPDATE SET "counter" = "reminders_reminderNumberCounter"."counter" + 1
					RETURNING "counter"
				`,
				[reminder.guildID],
			);
			const newNumber = dbParse(JustCounter, result.rows[0]).counter;

			await db.query(
				`
					INSERT INTO "reminders_reminders" (
						"guildID",
						"number",
						"ownerID",
						"channelID",
						"channelType",
						"createdAt",
						"firesAt",
						"message",
						"silent"
					)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
				`,
				[
					reminder.guildID,
					newNumber,
					reminder.ownerID,
					reminder.channelID,
					reminder.channelType,
					reminder.createdAt,
					reminder.firesAt,
					reminder.message,
					reminder.silent,
				],
			);

			return newNumber;
		});
	}

	export async function remove(
		db: Pool,
		guildID: string,
		number: number,
	): Promise<boolean> {
		if (!isSigned32(number)) {
			return false;
		}

		const result = await db.query(
			`
				DELETE FROM "reminders_reminders"
				WHERE "guildID" = $1 AND "number" = $2
			`,
			[guildID, number],
		);

		return result.rowCount === 1;
	}

	export async function removeIfOwnedBy(
		db: Pool,
		guildID: string,
		number: number,
		ownerID: string,
	): Promise<boolean> {
		if (!isSigned32(number)) {
			return false;
		}

		const result = await db.query(
			`
				DELETE FROM "reminders_reminders"
				WHERE "guildID" = $1 AND "number" = $2 AND "ownerID" = $3
			`,
			[guildID, number, ownerID],
		);

		return result.rowCount === 1;
	}
}
