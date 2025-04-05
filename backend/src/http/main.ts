import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs/promises";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import path from "path";
import { module_logger } from "../common/logger/index.ts";
import { delete_expired_tokens } from "../db/api/tokens.ts";
import { check_migrations_or_exit } from "../db/migration.ts";
import { CLIENT_ID, REDIRECT_URI } from "../environment.ts";
import api_v1 from "./api/v1/index.ts";

await check_migrations_or_exit();

const logger = module_logger();

const app = new Hono;
app.route("/api/v1", api_v1);

const static_root = "../frontend/static";
app.use("/*", serveStatic({ root: static_root })); // yea
app.get("/env.js", context => {
	const env = JSON.stringify({ CLIENT_ID, REDIRECT_URI });
	return context.body(`window.SQUIRREL_ENV=${env}`, 200, { "Content-Type": "text/javascript" });
});

app.notFound(
	async context =>
		context.html(await fs.readFile(path.join(static_root, "app.html"), "utf-8"))
);

app.onError((error, context) => {
	if (error instanceof HTTPException) {
		if (error.res !== undefined)
			return error.getResponse();

		return context.json({ error: error.message }, error.status);
	}

	logger.error("Something went wrong while serving an endpoint!", error);
	return context.json({ message: "Internal server error" }, 500);
});

serve({
	fetch: app.fetch,
	port: 8080,
});

setInterval(async () => await delete_expired_tokens(), 1000 * 60 * 60);
await delete_expired_tokens();
