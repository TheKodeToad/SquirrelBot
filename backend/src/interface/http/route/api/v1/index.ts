import auth from "#interface/http/route/api/v1/auth/index.ts";
import guilds from "#interface/http/route/api/v1/guilds.ts";
import { Hono } from "hono";

export default (): Hono => {
	const app = new Hono;

	app.route("/auth", auth());
	app.route("/guilds", guilds());

	return app;
};
