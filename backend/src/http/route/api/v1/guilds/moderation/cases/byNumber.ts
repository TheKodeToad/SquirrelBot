import type { GuildAuthVars } from "#http/middleware/guildAuth.ts";
import { serializeCaseObject } from "#http/route/api/v1/guilds/moderation/cases/index.ts";
import { getCase } from "#plugin/moderation/storage/cases.ts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const router = new Hono<{ Variables: GuildAuthVars; }>;
router.get("/:number{\\d+}", async context => {
	if (context.var.discordGuildID === undefined)
		throw new Error("Missing guild ID");

	const number = Number(context.req.param("number"));

	if (!Number.isSafeInteger(number))
		throw new HTTPException(400);

	const info = await getCase(context.var.discordGuildID, number);

	if (info === null)
		throw new HTTPException(400);

	return context.json(serializeCaseObject(info));
});
export default router;
