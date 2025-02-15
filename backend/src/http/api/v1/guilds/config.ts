import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { get_guild_config, update_guild_config } from "../../../../db/core/configs";
import { notify_channel } from "../../../../db/notification";
import { GuildAuthVars } from "../../../middleware/guild_auth";

const router = new Hono<{ Variables: GuildAuthVars; }>;

router.get("/:key", async context => {
	const config = await get_guild_config(context.var.discord_guild_id, context.req.param("key"));

	if (config === null)
		throw new HTTPException(404);

	return context.body(config, 200, { "Content-Type": "application/toml" });
});

router.put("/:key", async context => {
	if (context.req.header("Content-Type") !== "application/toml")
		throw new HTTPException(400, { message: "Content-Type is not application/toml" });

	const body = await context.req.text();
	const exists = await update_guild_config(context.var.discord_guild_id, context.req.param("key"), body);

	if (!exists)
		throw new HTTPException(404);

	await notify_channel(
		"config_update",
		JSON.stringify({
			guild_id: context.var.discord_guild_id,
			key: context.req.param("key")
		})
	);

	return context.body(null, 204);
});

export default router;