import pg from "pg";
import { parse, type InferOutput } from "valibot";
import type { Schema } from "../common/types.ts";
import { INTERNAL_TYPE_INTEGRITY } from "../environment.ts";

export const pool = new pg.Pool;

export function dbParse<const T extends Schema>(schema: T, input: unknown): InferOutput<T> {
	if (INTERNAL_TYPE_INTEGRITY)
		return parse(schema, input);
	else
		return input;
}
