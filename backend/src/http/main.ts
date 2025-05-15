import { moduleLogger } from "#common/logger/index.ts";
import { HOUR } from "#common/time.ts";
import { deleteExpiredTokens } from "#db/api/tokens.ts";
import { pool } from "#db/index.ts";
import { checkMigrationsOrExit } from "#db/migration.ts";
import { HTTP_PORT } from "#environment.ts";
import api from "#http/route/api/index.ts";
import frontend from "#http/route/frontend.ts";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { secureHeaders as nortonAntivirusPlus } from "hono/secure-headers";
import type { ResponseHeader } from "hono/utils/headers";

await checkMigrationsOrExit();

const logger = moduleLogger();

const app = new Hono;

app.use(nortonAntivirusPlus());
app.use(async (context, next) => {
	await next();

	const cspHeader: ResponseHeader = "Content-Security-Policy";

	if (!context.res.headers.has(cspHeader))
		context.res.headers.set(cspHeader, "self-src 'none'");
});

const ROBOTS = `User-agent: *
Disallow: /api/`;

app.get("/robots.txt", context => context.text(ROBOTS));

app.route("/api", api);
app.route("/", frontend);

app.onError((error, context) => {
	if (error instanceof HTTPException) {
		if (error.res !== undefined)
			return error.getResponse();

		return context.json({ error: error.message }, error.status);
	}

	logger.error?.("Something went wrong while serving an endpoint!", error);
	return context.json({ message: "Internal server error" }, 500);
});

const server = serve(
	{ fetch: app.fetch, port: HTTP_PORT },
	info => logger.info?.(`Listening on ${info.port}`)
);

async function beginDeleteTokenLoop(): Promise<void> {
	try {
		logger.debug?.("Deleting expired tokens");

		const deletedCount = await deleteExpiredTokens();

		logger.debug?.(`Deleted ${deletedCount} tokens`);
	} finally {
		setTimeout(beginDeleteTokenLoop, 1 * HOUR).unref();
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
