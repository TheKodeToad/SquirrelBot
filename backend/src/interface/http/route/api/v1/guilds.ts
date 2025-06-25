import { defineGlobalPluginRoutes, definePluginRoutes } from "#interface/http/extensionPoints.ts";
import { authMiddleware } from "#interface/http/middleware/auth.ts";
import { guildAuthMiddleware, type GuildAuthVars } from "#interface/http/middleware/guildAuth.ts";
import { getPlugins } from "#loader/index.ts";
import { getAPIGuildInfoByOwner } from "#plugin/core/storage/guildInfo.ts";
import { Hono } from "hono";

export default (): Hono => {
	const guildRouter = new Hono;
	guildRouter.use(authMiddleware);
	guildRouter.use(guildAuthMiddleware);

	for (const plugin of getPlugins()) {
		const pluginRouter = new Hono<{ Variables: GuildAuthVars; }>;

		for (const setup of definePluginRoutes.contributions.get(plugin) ?? [])
			setup(pluginRouter);

		for (const setup of defineGlobalPluginRoutes.contributions)
			setup(plugin, pluginRouter);

		guildRouter.route("/" + encodeURIComponent(plugin.id), pluginRouter);
	}

	const app = new Hono;
	app.route("/:guildID", guildRouter);
	app.get("/", authMiddleware, async context => context.json(await getAPIGuildInfoByOwner(context.var.discordUserID)));

	return app;
};
