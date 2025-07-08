import { defineGlobalPluginGuildRoutes } from "#interface/http/extensionPoints.ts";
import { getGuildConfig, updateGuildConfig } from "#plugin/core/storage/configs.ts";
import { notifyChannel } from "#storage/notification.ts";
import { HTTPException } from "hono/http-exception";

export default defineGlobalPluginGuildRoutes((plugin, app) => {
	app.get("/config", async context => {
		const config = await getGuildConfig(context.var.discordGuildID, plugin.id);

		if (config === null)
			throw new HTTPException(404, { message: "Config does not exist" });

		return context.body(config, 200, { "Content-Type": "application/toml" });
	});

	app.put("/config", async context => {
		if (context.req.header("Content-Type") !== "application/toml")
			throw new HTTPException(400, { message: "Content-Type is not application/toml" });

		const body = await context.req.text();
		const exists = await updateGuildConfig(context.var.discordGuildID, plugin.id, body);

		if (!exists)
			throw new HTTPException(404, { message: "Config does not exist" });

		await notifyChannel(
			"core_configUpdate",
			JSON.stringify({
				guildID: context.var.discordGuildID,
				pluginID: plugin.id,
			})
		);

		return context.body(null, 204);
	});
});
