import type { SquirrelHTTPContext } from "#http/index.ts";
import v1 from "#http/route/api/v1/index.ts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

export default (squirrelCtx: SquirrelHTTPContext): Hono => {
	const app = new Hono;

	app.route("/v1", v1(squirrelCtx));
	app.get("/hello", context => context.json("hello world"));
	app.all("/*", () => { throw new HTTPException(404, { message: "API route does not exist" }); });

	return app;
};
