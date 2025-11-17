import type { HTTPContext } from "#http/index.ts";
import auth from "#http/route/api/v1/auth/index.ts";
import guilds from "#http/route/api/v1/guilds.ts";
import { Hono } from "hono";

export default (httpCtx: HTTPContext): Hono => {
	const app = new Hono;

	app.route("/auth", auth(httpCtx));
	app.route("/guilds", guilds(httpCtx));

	return app;
};
