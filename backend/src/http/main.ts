import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs/promises";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { secureHeaders as nortonAntivirusPlus } from "hono/secure-headers";
import path from "path";
import { moduleLogger } from "../common/logger/index.ts";
import { deleteExpiredTokens } from "../db/api/tokens.ts";
import { pool } from "../db/index.ts";
import { checkMigrationsOrExit } from "../db/migration.ts";
import { CLIENT_ID, HTTP_PORT, REDIRECT_URI } from "../environment.ts";
import api_v1 from "./api/v1/index.ts";

await checkMigrationsOrExit();

const logger = moduleLogger();

const app = new Hono;

app.use(nortonAntivirusPlus({
	contentSecurityPolicy: { defaultSrc: ["'self'"], imgSrc: ["'self' cdn.discordapp.com"] }
}));

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

const server = serve({
	fetch: app.fetch,
	port: HTTP_PORT,
}, info => logger.info?.(`Listening on ${info.port}`));

async function beginDeleteTokenLoop(): Promise<void> {
	try {
		logger.debug?.("Deleting expired tokens");

		const deletedCount = await deleteExpiredTokens();

		logger.debug?.(`Deleted ${deletedCount} tokens`);
	} finally {
		setTimeout(beginDeleteTokenLoop, 60 * 60 * 1000).unref();
	}
}

await beginDeleteTokenLoop();

process.on("unhandledRejection", rejection => {
	logger.error?.("Unhandled Promise rejection!", rejection);
});

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);

let exitingAfter = 0;

async function shutDown(signal: NodeJS.Signals): Promise<void> {
	if (exitingAfter !== 0) {
		logger.warn?.(`Already attempting shutdown - exit will be forced after ${exitingAfter} seconds`);
		return;
	}

	logger.info?.(`Received ${signal}; attempting graceful shutdown`);

	if (signal === "SIGTERM")
		exitingAfter = 30;
	else
		exitingAfter = 5;

	setTimeout(() => {
		logger.warn?.(`Forced exit after waiting for ${exitingAfter} seconds`);
		process.exit(1);
	}, exitingAfter * 1000).unref();

	try {
		await new Promise<void>((resolve, reject) => server.close(error => {
			if (error !== undefined)
				reject(error);
			else
				resolve();
		}));

		await pool.end();
	} catch (error) {
		logger.error?.(`Unhandled error during cleanup; exit will be forced after ${exitingAfter} seconds`, error);
	}
}
