import { defineGlobalPluginGuildRoutes, definePluginGuildRoutes } from "#http/extensionPoints.ts";
import type { HTTPContext } from "#http/index.ts";
import { authMiddleware } from "#http/middleware/auth.ts";
import { guildAuthMiddleware, type GuildAuthVars } from "#http/middleware/guildAuth.ts";
import { getAPIGuildInfoByOwner } from "#plugin/core/storage/guildInfo.ts";
import { Hono } from "hono";

export default (httpCtx: HTTPContext): Hono => {
	const guildRouter = new Hono;
	guildRouter.use(authMiddleware(httpCtx.db));
	guildRouter.use(guildAuthMiddleware(httpCtx.db));

	for (const plugin of httpCtx.plugins.values()) {
		const pluginRouter = new Hono<{ Variables: GuildAuthVars; }>;

		for (const setup of definePluginGuildRoutes.contributions.get(plugin) ?? [])
			setup(httpCtx, pluginRouter);

		for (const setup of defineGlobalPluginGuildRoutes.contributions)
			setup(httpCtx, plugin, pluginRouter);

		guildRouter.route("/" + encodeURIComponent(plugin.id), pluginRouter);
	}

	const app = new Hono;
	app.route("/:guildID/plugins", guildRouter);
	app.get("/", authMiddleware(httpCtx.db), async context => context.json(await getAPIGuildInfoByOwner(httpCtx.db, context.var.discordUserID)));

	return app;
};
