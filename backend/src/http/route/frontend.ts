import {
	APP_DESCRIPTION,
	APP_INVITE_PERMISSIONS,
	APP_LIBRARIES_LINK,
	APP_NAME,
	APP_SOURCE_CODE,
} from "#brand.ts";
import { CLIENT_ID, REDIRECT_URI } from "#environment.ts";
import type { SquirrelHTTPContext } from "#http/index.ts";
import { serveStatic } from "@hono/node-server/serve-static";
import { randomBytes } from "crypto";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { etag } from "hono/etag";
import { html, raw } from "hono/html";

export default (squirrelCtx: SquirrelHTTPContext): Hono => {
	const app = new Hono();

	// TODO: worrying
	app.use(
		"/static/*",
		compress(),
		etag(),
		serveStatic({ root: "../frontend" }),
	); // yea

	const env = {
		CLIENT_ID,
		REDIRECT_URI,

		APP_NAME,
		APP_DESCRIPTION,
		APP_SOURCE_CODE,
		APP_LIBRARIES_LINK,
		APP_INVITE_PERMISSIONS: APP_INVITE_PERMISSIONS.toString(),
	};

	const plugins = [...squirrelCtx.plugins.values()].map((plugin) => ({
		id: plugin.id,
		name: plugin.name,
		description: plugin.description,
	}));

	const constants = JSON.stringify({ env, plugins })
		.replaceAll("<", "\\u003c")
		.replaceAll(">", "\\u003e");

	app.get("/*", (ctx) => {
		const nonce = randomBytes(16).toString("base64");

		const csp = [];

		csp.push("default-src 'none'");
		csp.push("connect-src 'self'");
		csp.push(`script-src 'nonce-${nonce}'`);
		csp.push("img-src 'self' cdn.discordapp.com");
		csp.push("style-src 'self' 'unsafe-inline'");

		const generated = html`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${APP_NAME} Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" type="text/css" media="screen" href="/static/app.css" />
    <script type="application/json" nonce="${nonce}" id="constants">${raw(constants)}</script>
    <script src="/static/app.js" nonce="${nonce}" defer></script>
  </head>
  <body id="app" class="gruvbox">
    <noscript>This website cannot be run in DOS mode</noscript>
  </body>
</html>`;

		return ctx.html(generated, 200, {
			"Content-Security-Policy": csp.join("; "),
		});
	});

	return app;
};
