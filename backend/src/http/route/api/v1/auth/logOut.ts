import type { BackendHTTPContext } from "#http/http.ts";
import { tokensTable } from "#http/storage/api/tokens.ts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

export default (backendCtx: BackendHTTPContext): Hono => {
	const app = new Hono();

	app.get("/", async (ctx) => {
		const authorization = ctx.req.header("Authorization");

		if (authorization === undefined) {
			throw new HTTPException(401, {
				message: "No Authorization header provided",
			});
		}

		if (!(await tokensTable.remove(backendCtx.db, authorization))) {
			throw new HTTPException(401, {
				message: "Invalid or expired token",
			});
		}

		return ctx.body(null, 204);
	});

	return app;
};
