import type { BackendHTTPContext } from "#http/http.ts";
import logIn from "#http/route/api/v1/auth/logIn.ts";
import logOut from "#http/route/api/v1/auth/logOut.ts";
import { Hono } from "hono";

export default (backendCtx: BackendHTTPContext): Hono => {
	const app = new Hono();

	app.route("/log-in", logIn(backendCtx));
	app.route("/log-out", logOut(backendCtx));

	return app;
};
