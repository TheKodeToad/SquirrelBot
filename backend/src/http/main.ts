import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { delete_expired_tokens } from "../db/api/tokens";
import api_v1 from "./api/v1";

async function main() {
	const app = new Hono;
	app.route("/api/v1", api_v1);
	app.use("/", serveStatic({ root: "../frontend/static" })); // yea
	serve({
		fetch: app.fetch,
		port: 8080,
	});

	setInterval(async () => await delete_expired_tokens(), 1000 * 60 * 60 * 12);
	await delete_expired_tokens();
}

main();
