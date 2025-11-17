import type { HTTPContext } from "#http/index.ts";
import v1 from "#http/route/api/v1/index.ts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

export default (httpCtx: HTTPContext): Hono => {
	const app = new Hono;

	app.route("/v1", v1(httpCtx));
	app.get("/hello", context => context.json("hello world"));
	app.all("/*", () => { throw new HTTPException(404, { message: "API route does not exist" }); });

	return app;
};
