import { defineGlobalPluginGuildRoutes } from "#http/extensionPoints.ts";
import { getGuildConfig, updateGuildConfig } from "#plugin/core/storage/configs.ts";
import { notifyChannel } from "#storage/notification.ts";
import { HTTPException } from "hono/http-exception";

export default defineGlobalPluginGuildRoutes((squirrelCtx, plugin, app) => {
	app.get("/config", async ctx => {
		const config = await getGuildConfig(squirrelCtx.db, ctx.var.discordGuildID, plugin.id);

		if (config === null) {
			throw new HTTPException(404, { message: "Config does not exist" });
		}

		return ctx.body(config, 200, { "Content-Type": "application/toml" });
	});

	app.put("/config", async ctx => {
		if (ctx.req.header("Content-Type") !== "application/toml") {
			throw new HTTPException(400, { message: "Content-Type is not application/toml" });
		}

		const body = await ctx.req.text();
		const exists = await updateGuildConfig(squirrelCtx.db, ctx.var.discordGuildID, plugin.id, body);

		if (!exists) {
			throw new HTTPException(404, { message: "Config does not exist" });
		}

		await notifyChannel(
			squirrelCtx.db,
			"core_configUpdate",
			JSON.stringify({
				guildID: ctx.var.discordGuildID,
				pluginID: plugin.id,
			})
		);

		return ctx.body(null, 204);
	});
});
