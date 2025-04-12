import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { isSnowflake } from "../../common/snowflake.ts";
import { getGuildOwnerID } from "../../db/core/guild_info.ts";

export type GuildAuthVars = {
	discordGuildID: string;
	discordUserID: string;
};

export const guildAuthMiddleware = createMiddleware<{ Variables: GuildAuthVars; }>(async (context, next) => {
	const { discordUserID } = context.var;
	const guildID = context.req.param("guildID");

	if (typeof discordUserID !== "string")
		throw new Error("Missing auth middleware");

	if (typeof guildID !== "string")
		throw new Error("Missing guildID path parameter");

	if (!isSnowflake(guildID))
		throw new HTTPException(400, { message: "Malformed guild id" });

	const owner = await getGuildOwnerID(guildID);

	if (owner === null || owner !== discordUserID)
		throw new HTTPException(403, { message: "Missing permission" });

	context.set("discordGuildID", guildID);
	await next();
});