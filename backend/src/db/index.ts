import pg from "pg";
import { parse, type BaseIssue, type BaseSchema, type InferOutput } from "valibot";
import { INTERNAL_TYPE_INTEGRITY } from "../environment.ts";

export const pool = new pg.Pool;

export function db_parse<const T extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(schema: T, input: unknown): InferOutput<T> {
	if (INTERNAL_TYPE_INTEGRITY)
		return parse(schema, input);
	else
		return input;
}