import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { get_case } from "../../../../../../db/moderation/cases.ts";
import type { GuildAuthVars } from "../../../../../middleware/guild_auth.ts";
import { serialise_case_object } from "./index.ts";

const router = new Hono<{ Variables: GuildAuthVars; }>;
router.get("/:number{\\d+}", async context => {
	if (context.var.discord_guild_id === undefined)
		throw new Error("Missing guild ID");

	const number = Number(context.req.param("number"));

	if (!Number.isSafeInteger(number))
		throw new HTTPException(400);

	const info = await get_case(context.var.discord_guild_id, number);

	if (info === null)
		throw new HTTPException(400);

	return context.json(serialise_case_object(info));
});
export default router;
