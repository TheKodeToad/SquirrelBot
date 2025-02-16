import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { is_snowflake } from "../../common/snowflake.ts";
import { get_guild_owner_id } from "../../db/core/guild_info.ts";

export type GuildAuthVars = {
	discord_guild_id: string;
	discord_user_id: string;
};

export const guild_auth_middleware = createMiddleware<{ Variables: GuildAuthVars; }>(async (context, next) => {
	const { discord_user_id } = context.var;
	const guild_id = context.req.param("guild_id");

	if (typeof discord_user_id !== "string")
		throw new Error("Missing auth middleware");

	if (typeof guild_id !== "string")
		throw new Error("Missing guild_id path parameter");

	if (!is_snowflake(guild_id))
		throw new HTTPException(400, { message: "Malformed guild id" });

	const owner = await get_guild_owner_id(guild_id);

	if (owner === null || owner !== discord_user_id)
		throw new HTTPException(403, { message: "Missing permission" });

	context.set("discord_guild_id", guild_id);
	await next();
});