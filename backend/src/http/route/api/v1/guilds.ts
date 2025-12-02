import {
	defineGlobalPluginGuildRoutes,
	definePluginGuildRoutes,
} from "#http/extensionPoints.ts";
import type { BackendHTTPContext } from "#http/http.ts";
import { authMiddleware } from "#http/middleware/auth.ts";
import {
	guildAuthMiddleware,
	type GuildAuthVars,
} from "#http/middleware/guildAuth.ts";
import { guildInfoTable } from "#plugins/core/storage/guildInfo.ts";
import { Hono } from "hono";

export default (backendCtx: BackendHTTPContext): Hono => {
	const guildRouter = new Hono();
	guildRouter.use(authMiddleware(backendCtx.db));
	guildRouter.use(guildAuthMiddleware(backendCtx.db));

	for (const plugin of backendCtx.plugins.values()) {
		const pluginRouter = new Hono<{ Variables: GuildAuthVars }>();

		for (const setup of definePluginGuildRoutes.contributions.get(plugin)
			?? []) {
			setup(backendCtx, pluginRouter);
		}

		for (const setup of defineGlobalPluginGuildRoutes.contributions) {
			setup(backendCtx, plugin, pluginRouter);
		}

		guildRouter.route("/" + encodeURIComponent(plugin.id), pluginRouter);
	}

	const app = new Hono();
	app.route("/:guildID/plugins", guildRouter);
	app.get("/", authMiddleware(backendCtx.db), async (ctx) =>
		ctx.json(
			await guildInfoTable.getPublicByOwner(
				backendCtx.db,
				ctx.var.discordUserID,
			),
		),
	);

	return app;
};
