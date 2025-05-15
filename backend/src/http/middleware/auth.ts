import { validateToken } from "#db/api/tokens.ts";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export type AuthVars = {
	discordUserID: string;
};

export const authMiddleware = createMiddleware<{ Variables: AuthVars; }>(async (context, next) => {
	const authorization = context.req.header("Authorization");

	if (authorization === undefined)
		throw new HTTPException(401, { message: "No Authorization header provided" });

	const user = await validateToken(authorization);

	if (user === null)
		throw new HTTPException(401, { message: "Invalid or expired token" });

	context.set("discordUserID", user);
	await next();
});
