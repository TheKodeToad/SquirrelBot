import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { validate_token } from "../../db/api/tokens.ts";

export type AuthVars = {
	discord_user_id: string;
};

export const auth_middleware = createMiddleware<{ Variables: AuthVars; }>(async (context, next) => {
	const authorization = context.req.header("Authorization");

	if (authorization === undefined)
		throw new HTTPException(401, { message: "No Authorization header provided" });

	const user = await validate_token(authorization);

	if (user === null)
		throw new HTTPException(401, { message: "Invalid or expired token" });

	context.set("discord_user_id", user);
	await next();
});
