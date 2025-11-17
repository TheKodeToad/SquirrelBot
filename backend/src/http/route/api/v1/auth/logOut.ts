import type { HTTPContext } from "#http/index.ts";
import { deleteToken } from "#http/storage/api/tokens.ts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

export default (httpCtx: HTTPContext): Hono => {
	const app = new Hono;

	app.get("/", async context => {
		const authorization = context.req.header("Authorization");

		if (authorization === undefined)
			throw new HTTPException(401, { message: "No Authorization header provided" });

		if (!await deleteToken(httpCtx.db, authorization))
			throw new HTTPException(401, { message: "Invalid or expired token" });

		return context.body(null, 204);
	});

	return app;
};
