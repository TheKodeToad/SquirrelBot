import { moduleLogger } from "#common/logger/index.ts";
import { HOUR } from "#common/time.ts";
import { HTTP_PORT } from "#environment.ts";
import type { HTTPContext } from "#http/index.ts";
import api from "#http/route/api/index.ts";
import frontend from "#http/route/frontend.ts";
import { deleteExpiredTokens } from "#http/storage/api/tokens.ts";
import { createContext, shutdownContext } from "#loader/index.ts";
import { preMain, setupGracefulShutdown } from "#setup.ts";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { secureHeaders as nortonAntivirusPlus } from "hono/secure-headers";
import type { ResponseHeader } from "hono/utils/headers";

preMain();

const logger = moduleLogger();
const ctx: HTTPContext = await createContext();

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

app.route("/api", api(ctx));
app.route("/", frontend(ctx));

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

		const deletedCount = await deleteExpiredTokens(ctx.db);

		logger.debug?.(`Deleted ${deletedCount} tokens`);
	} finally {
		setTimeout(beginDeleteTokenLoop, 1 * HOUR).unref();
	}
}

await beginDeleteTokenLoop();

setupGracefulShutdown(async () => {
	await new Promise<void>((resolve, reject) => server.close(error => {
		if (error !== undefined)
			reject(error);
		else
			resolve();
	}));

	shutdownContext(ctx);
});
