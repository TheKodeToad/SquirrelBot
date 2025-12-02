import type { BackendHTTPContext } from "#http/http.ts";
import v1 from "#http/route/api/v1/v1.ts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

export default (backendCtx: BackendHTTPContext): Hono => {
	const app = new Hono();

	app.route("/v1", v1(backendCtx));
	app.get("/hello", (ctx) => ctx.json("hello world"));
	app.all("/*", () => {
		throw new HTTPException(404, { message: "API route does not exist" });
	});

	return app;
};
