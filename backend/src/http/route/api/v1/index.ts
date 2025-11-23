import type { SquirrelHTTPContext } from "#http/index.ts";
import auth from "#http/route/api/v1/auth/index.ts";
import guilds from "#http/route/api/v1/guilds.ts";
import { Hono } from "hono";

export default (squirrelCtx: SquirrelHTTPContext): Hono => {
	const app = new Hono();

	app.route("/auth", auth(squirrelCtx));
	app.route("/guilds", guilds(squirrelCtx));

	return app;
};
