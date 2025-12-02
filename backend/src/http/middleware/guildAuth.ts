import { isSnowflake } from "#common/snowflakes.ts";
import { getGuildOwnerID } from "#plugins/core/storage/guildInfo.ts";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Pool } from "pg";

export type GuildAuthVars = {
	discordGuildID: string;
	discordUserID: string;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function guildAuthMiddleware(db: Pool) {
	return createMiddleware<{ Variables: GuildAuthVars }>(async (ctx, next) => {
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
}
