import logIn from "#http/route/api/v1/auth/logIn.ts";
import logOut from "#http/route/api/v1/auth/logOut.ts";
import { Hono } from "hono";

export default (): Hono => {
	const app = new Hono;

	app.route("/log-in", logIn());
	app.route("/log-out", logOut());

	return app;
};
