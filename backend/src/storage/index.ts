import { DATA_PATH, INTERNAL_TYPE_INTEGRITY } from "#environment.ts";
import Database from 'better-sqlite3';
import { z } from "zod/v4";

export const sqlite = new Database(DATA_PATH + "/db.sqlite3");

export function dbParse<T extends z.ZodType>(type: T, input: unknown): z.infer<T> {
	if (INTERNAL_TYPE_INTEGRITY)
		return type.parse(input);
	else {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return input as any;
	}
}
