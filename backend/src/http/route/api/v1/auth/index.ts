import type { SquirrelHTTPContext } from "#http/index.ts";
import logIn from "#http/route/api/v1/auth/logIn.ts";
import logOut from "#http/route/api/v1/auth/logOut.ts";
import { Hono } from "hono";

export default (squirrelCtx: SquirrelHTTPContext): Hono => {
	const app = new Hono();

	app.route("/log-in", logIn(squirrelCtx));
	app.route("/log-out", logOut(squirrelCtx));

	return app;
};
