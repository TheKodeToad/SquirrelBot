import type { HTTPContext } from "#http/index.ts";
import logIn from "#http/route/api/v1/auth/logIn.ts";
import logOut from "#http/route/api/v1/auth/logOut.ts";
import { Hono } from "hono";

export default (httpCtx: HTTPContext): Hono => {
	const app = new Hono;

	app.route("/log-in", logIn(httpCtx));
	app.route("/log-out", logOut(httpCtx));

	return app;
};
