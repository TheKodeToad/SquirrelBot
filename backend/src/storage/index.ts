import { INTERNAL_TYPE_INTEGRITY } from "#environment.ts";
import pg from "pg";
import { z, ZodType } from "zod/v4";

export const postgres = new pg.Pool;

export function dbParse<Z extends ZodType>(type: Z, input: unknown): z.infer<Z> {
	if (INTERNAL_TYPE_INTEGRITY)
		return type.parse(input);
	else {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return input as any;
	}
}
