import { validateToken } from "#http/storage/api/tokens.ts";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Pool } from "pg";

export type AuthVars = {
	discordUserID: string;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function authMiddleware(db: Pool) {
	return createMiddleware<{ Variables: AuthVars; }>(async (ctx, next) => {
		const authorization = ctx.req.header("Authorization");

		if (authorization === undefined)
			throw new HTTPException(401, { message: "No Authorization header provided" });

		const user = await validateToken(db, authorization);

		if (user === null)
			throw new HTTPException(401, { message: "Invalid or expired token" });

		ctx.set("discordUserID", user);
		await next();
	});
}
