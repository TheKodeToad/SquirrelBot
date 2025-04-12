import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getGuildConfig, updateGuildConfig } from "../../../../db/core/configs.ts";
import { notifyChannel } from "../../../../db/notification.ts";
import type { GuildAuthVars } from "../../../middleware/guild_auth.ts";

const router = new Hono<{ Variables: GuildAuthVars; }>;

router.get("/:key", async context => {
	const config = await getGuildConfig(context.var.discordGuildID, context.req.param("key"));

	if (config === null)
		throw new HTTPException(404);

	return context.body(config, 200, { "Content-Type": "application/toml" });
});

router.put("/:key", async context => {
	if (context.req.header("Content-Type") !== "application/toml")
		throw new HTTPException(400, { message: "Content-Type is not application/toml" });

	const body = await context.req.text();
	const exists = await updateGuildConfig(context.var.discordGuildID, context.req.param("key"), body);

	if (!exists)
		throw new HTTPException(404);

	await notifyChannel(
		"config_update",
		JSON.stringify({
			guild_id: context.var.discordGuildID,
			key: context.req.param("key")
		})
	);

	return context.body(null, 204);
});

export default router;