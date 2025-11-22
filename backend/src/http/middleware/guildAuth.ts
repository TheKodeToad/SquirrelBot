import { isSnowflake } from "#common/snowflake.ts";
import { getGuildOwnerID } from "#plugin/core/storage/guildInfo.ts";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Pool } from "pg";

export type GuildAuthVars = {
	discordGuildID: string;
	discordUserID: string;
};

export const guildAuthMiddleware = (db: Pool) => createMiddleware<{ Variables: GuildAuthVars; }>(async (ctx, next) => {
	const { discordUserID } = ctx.var;
	const guildID = ctx.req.param("guildID");

	if (typeof discordUserID !== "string") {
		throw new Error("Missing auth middleware");
	}

	if (typeof guildID !== "string") {
		throw new Error("Missing guildID path parameter");
	}

	if (!isSnowflake(guildID)) {
		throw new HTTPException(400, { message: "Malformed guild id" });
	}

	const owner = await getGuildOwnerID(db, guildID);

	if (owner === null || owner !== discordUserID) {
		throw new HTTPException(403, { message: "Missing permission" });
	}

	ctx.set("discordGuildID", guildID);
	await next();
});
