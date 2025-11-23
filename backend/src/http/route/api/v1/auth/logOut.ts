import type { SquirrelHTTPContext } from "#http/index.ts";
import { deleteToken } from "#http/storage/api/tokens.ts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

export default (squirrelCtx: SquirrelHTTPContext): Hono => {
	const app = new Hono();

	app.get("/", async (ctx) => {
		const authorization = ctx.req.header("Authorization");

		if (authorization === undefined) {
			throw new HTTPException(401, {
				message: "No Authorization header provided",
			});
		}

		if (!(await deleteToken(squirrelCtx.db, authorization))) {
			throw new HTTPException(401, {
				message: "Invalid or expired token",
			});
		}

		return ctx.body(null, 204);
	});

	return app;
};
