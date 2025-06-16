import type { GuildAuthVars } from "#interface/http/middleware/guildAuth.ts";
import { getGuildConfig, updateGuildConfig } from "#plugin/core/storage/configs.ts";
import { notifyChannel } from "#storage/notification.ts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const router = new Hono<{ Variables: GuildAuthVars; }>;

router.get("/:key", async context => {
	const config = await getGuildConfig(context.var.discordGuildID, context.req.param("key"));

	if (config === null)
		throw new HTTPException(404, { message: "Config does not exist" });

	return context.body(config, 200, { "Content-Type": "application/toml" });
});

router.put("/:key", async context => {
	if (context.req.header("Content-Type") !== "application/toml")
		throw new HTTPException(400, { message: "Content-Type is not application/toml" });

	const body = await context.req.text();
	const exists = await updateGuildConfig(context.var.discordGuildID, context.req.param("key"), body);

	if (!exists)
		throw new HTTPException(404, { message: "Config does not exist" });

	await notifyChannel(
		"core_configUpdate",
		JSON.stringify({
			guildID: context.var.discordGuildID,
			key: context.req.param("key")
		})
	);

	return context.body(null, 204);
});

export default router;
