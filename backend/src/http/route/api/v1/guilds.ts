import { defineGlobalPluginGuildRoutes, definePluginGuildRoutes } from "#http/extensionPoints.ts";
import type { SquirrelHTTPContext } from "#http/index.ts";
import { authMiddleware } from "#http/middleware/auth.ts";
import { guildAuthMiddleware, type GuildAuthVars } from "#http/middleware/guildAuth.ts";
import { getAPIGuildInfoByOwner } from "#plugin/core/storage/guildInfo.ts";
import { Hono } from "hono";

export default (squirrelCtx: SquirrelHTTPContext): Hono => {
	const guildRouter = new Hono;
	guildRouter.use(authMiddleware(squirrelCtx.db));
	guildRouter.use(guildAuthMiddleware(squirrelCtx.db));

	for (const plugin of squirrelCtx.plugins.values()) {
		const pluginRouter = new Hono<{ Variables: GuildAuthVars; }>;

		for (const setup of definePluginGuildRoutes.contributions.get(plugin) ?? [])
			setup(squirrelCtx, pluginRouter);

		for (const setup of defineGlobalPluginGuildRoutes.contributions)
			setup(squirrelCtx, plugin, pluginRouter);

		guildRouter.route("/" + encodeURIComponent(plugin.id), pluginRouter);
	}

	const app = new Hono;
	app.route("/:guildID/plugins", guildRouter);
	app.get("/", authMiddleware(squirrelCtx.db), async ctx => ctx.json(await getAPIGuildInfoByOwner(squirrelCtx.db, ctx.var.discordUserID)));

	return app;
};
