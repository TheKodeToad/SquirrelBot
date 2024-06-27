import { Router } from "express";
import { get_guild_info_by_owner } from "../../../../data/core/guild_info";
import { async_request_handler } from "../../../handler";
import { auth_middleware } from "../../../handler/auth";
import { guild_auth_middleware } from "../../../handler/guild_auth";

const guild_router = Router();
guild_router.use("/moderation", require("./moderation").default);

const router = Router();
router.use(
	"/:guild_id([0-9]{17,20})",
	auth_middleware,
	guild_auth_middleware,
	guild_router
);
router.get("/", auth_middleware, async_request_handler(async (request, response) => {
	if (request.discord_user_id === undefined)
		throw new Error("Missing user ID");

	response.send(await get_guild_info_by_owner(request.discord_user_id));
}));
export default router;
