import express from "express";
import PromiseRouter from "express-promise-router";
import { get_guild_config, update_guild_config } from "../../../../db/core/configs";
import { notify_channel } from "../../../../db/notification";

const router = PromiseRouter();

router.get("/:key", async (request, response) => {
	if (request.discord_guild_id === undefined)
		throw new Error("Missing guild ID");

	const config = await get_guild_config(request.discord_guild_id, request.params.key);

	if (config === null) {
		response.sendStatus(404);
		return;
	}

	response.type("application/toml").send(config);
});
router.put("/:key", express.text(), async (request, response) => {
	if (request.discord_guild_id === undefined)
		throw new Error("Missing guild ID");

	if (typeof request.body !== "string") {
		response.sendStatus(400);
		return;
	}

	const exists = await update_guild_config(request.discord_guild_id, request.params.key, request.body);

	if (!exists) {
		response.sendStatus(404);
		return;
	}

	await notify_channel(
		"config_update",
		JSON.stringify({
			guild_id: request.discord_guild_id,
			key: request.params.key
		})
	);

	response.status(204).send();
});

export default router;