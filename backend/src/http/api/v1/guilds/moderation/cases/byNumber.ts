import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCase } from "../../../../../../db/moderation/cases.ts";
import type { GuildAuthVars } from "../../../../../middleware/guildAuth.ts";
import { serializeCaseObject } from "./index.ts";

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
