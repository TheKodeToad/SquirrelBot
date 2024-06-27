import { async_request_handler } from ".";
import { is_snowflake } from "../../common/snowflake";
import { get_guild_owner_id } from "../../data/core/guild_info";

declare global {
	namespace Express {
		interface Request {
			discord_guild_id?: string;
		}
	}
}

export const guild_auth_middleware = async_request_handler(async (request, response, next) => {
	const { discord_user_id } = request;
	const { guild_id } = request.params;

	if (discord_user_id === undefined)
		throw new Error("Missing auth middleware");

	if (guild_id === undefined)
		throw new Error("Missing guild_id path parameter");

	if (!is_snowflake(guild_id)) {
		response.sendStatus(400);
		return;
	}

	const owner = await get_guild_owner_id(guild_id);

	if (owner === null || owner !== discord_user_id) {
		response.sendStatus(403);
		return;
	}

	request.discord_guild_id = guild_id;
	next();
});