import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs/promises";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import path from "path";
import { moduleLogger } from "../common/logger/index.ts";
import { deleteExpiredTokens } from "../db/api/tokens.ts";
import { checkMigrationsOrExit } from "../db/migration.ts";
import { CLIENT_ID, REDIRECT_URI } from "../environment.ts";
import api_v1 from "./api/v1/index.ts";

await checkMigrationsOrExit();

const logger = moduleLogger();

const app = new Hono;
app.route("/api/v1", api_v1);

const staticRoot = "../frontend/static";
app.use("/*", serveStatic({ root: staticRoot })); // yea
app.get("/env.js", context => {
	const env = JSON.stringify({ CLIENT_ID, REDIRECT_URI });
	return context.body(`window.SQUIRREL_ENV=${env}`, 200, { "Content-Type": "text/javascript" });
});

app.notFound(
	async context =>
		context.html(await fs.readFile(path.join(staticRoot, "app.html"), "utf-8"))
);

app.onError((error, context) => {
	if (error instanceof HTTPException) {
		if (error.res !== undefined)
			return error.getResponse();

		return context.json({ error: error.message }, error.status);
	}

	logger.error?.("Something went wrong while serving an endpoint!", error);
	return context.json({ message: "Internal server error" }, 500);
});

serve({
	fetch: app.fetch,
	port: 8080,
});

setInterval(async () => await deleteExpiredTokens(), 1000 * 60 * 60);
await deleteExpiredTokens();
