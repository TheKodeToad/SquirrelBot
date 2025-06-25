import v1 from "#interface/http/route/api/v1/index.ts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

export default (): Hono => {
	const app = new Hono;

	app.route("/v1", v1());
	app.get("/hello", context => context.json("hello world"));
	app.all("/*", () => { throw new HTTPException(404, { message: "API route does not exist" }); });

	return app;
};
