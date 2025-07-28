import auth from "#http/route/api/v1/auth/index.ts";
import guilds from "#http/route/api/v1/guilds.ts";
import plugins from "#http/route/api/v1/plugins.ts";
import { Hono } from "hono";

export default (): Hono => {
	const app = new Hono;

	app.route("/auth", auth());
	app.route("/guilds", guilds());
	app.route("/plugins", plugins());

	return app;
};
