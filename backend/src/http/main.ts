import { backendInit, backendShutdown } from "#backend.ts";
import { moduleLogger } from "#common/logger/logger.ts";
import { setupShutdownHook } from "#common/shutdownHook.ts";
import { HOUR } from "#common/time.ts";
import { HTTP_PORT } from "#environment.ts";
import type { BackendHTTPContext } from "#http/http.ts";
import api from "#http/route/api/api.ts";
import frontend from "#http/route/frontend.ts";
import { tokensTable } from "#http/storage/api/tokens.ts";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { secureHeaders as nortonAntivirusPlus } from "hono/secure-headers";
import type { ResponseHeader } from "hono/utils/headers";

const ctx: BackendHTTPContext = await backendInit();

const logger = moduleLogger();

const app = new Hono();

app.use(nortonAntivirusPlus());
app.use(async (ctx, next) => {
	await next();

	const cspHeader: ResponseHeader = "Content-Security-Policy";

	if (!ctx.res.headers.has(cspHeader)) {
		ctx.res.headers.set(cspHeader, "self-src 'none'");
	}
});

const ROBOTS = `User-agent: *
Disallow: /api/`;

app.get("/robots.txt", (ctx) => ctx.text(ROBOTS));

app.route("/api", api(ctx));
app.route("/", frontend(ctx));

app.onError((error, ctx) => {
	if (error instanceof HTTPException) {
		if (error.res !== undefined) {
			return error.getResponse();
		}

		return ctx.json({ error: error.message }, error.status);
	}

	logger.error?.("Something went wrong while serving an endpoint!", error);
	return ctx.json({ message: "Internal server error" }, 500);
});

const server = serve({ fetch: app.fetch, port: HTTP_PORT }, (info) =>
	logger.info?.(`Listening on ${info.port}`),
);

async function beginDeleteTokenLoop(): Promise<void> {
	try {
		logger.debug?.("Deleting expired tokens");

		const deletedCount = await tokensTable.removeExpiredTokens(ctx.db);

		logger.debug?.(`Deleted ${deletedCount} tokens`);
	} finally {
		setTimeout(beginDeleteTokenLoop, 1 * HOUR).unref();
	}
}

await beginDeleteTokenLoop();

setupShutdownHook(async () => {
	await new Promise<void>((resolve, reject) =>
		server.close((error) => {
			if (error !== undefined) {
				reject(error);
			} else {
				resolve();
			}
		}),
	);

	await backendShutdown(ctx);
});
