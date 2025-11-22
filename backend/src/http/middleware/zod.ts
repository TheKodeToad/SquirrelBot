import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import { HTTPException } from "hono/http-exception";
import type { z } from "zod";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function validate<TSchema extends z.ZodType, TTarget extends keyof ValidationTargets>(target: TTarget, schema: TSchema) {
	return zValidator(target, schema, (result, ctx) => {
		if (!result.success) {
			throw new HTTPException(400, {
				res: ctx.json({
					error: "Schema validation failed",
					issues: result.error.issues
				})
			});
		}
	});
}
