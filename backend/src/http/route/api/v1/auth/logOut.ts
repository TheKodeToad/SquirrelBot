import type { SquirrelHTTPContext } from "#http/index.ts";
import { deleteToken } from "#http/storage/api/tokens.ts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

export default (squirrelCtx: SquirrelHTTPContext): Hono => {
	const app = new Hono;

	app.get("/", async context => {
		const authorization = context.req.header("Authorization");

		if (authorization === undefined)
			throw new HTTPException(401, { message: "No Authorization header provided" });

		if (!await deleteToken(squirrelCtx.db, authorization))
			throw new HTTPException(401, { message: "Invalid or expired token" });

		return context.body(null, 204);
	});

	return app;
};
