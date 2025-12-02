import type { BackendHTTPContext } from "#http/http.ts";
import auth from "#http/route/api/v1/auth/auth.ts";
import guilds from "#http/route/api/v1/guilds.ts";
import { Hono } from "hono";

export default (backendCtx: BackendHTTPContext): Hono => {
	const app = new Hono();

	app.route("/auth", auth(backendCtx));
	app.route("/guilds", guilds(backendCtx));

	return app;
};
