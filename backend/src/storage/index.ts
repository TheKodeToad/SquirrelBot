import { INTERNAL_TYPE_INTEGRITY } from "#environment.ts";
import { z } from "zod/v4";

export function dbParse<T extends z.ZodType>(type: T, input: unknown): z.infer<T> {
	if (INTERNAL_TYPE_INTEGRITY) {
		return type.parse(input);
	} else {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return input as any;
	}
}
