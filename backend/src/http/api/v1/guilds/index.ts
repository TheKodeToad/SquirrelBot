import PromiseRouter from "express-promise-router";
import { get_guild_info_by_owner } from "../../../../db/core/guild_info";
import { auth_middleware } from "../../../middleware/auth";
import { guild_auth_middleware } from "../../../middleware/guild_auth";

const guild_router = PromiseRouter();
guild_router.use("/moderation", require("./moderation").default);

const router = PromiseRouter();
router.use(
	"/:guild_id([0-9]{17,20})",
	auth_middleware,
	guild_auth_middleware,
	guild_router
);
router.get("/", auth_middleware, async (request, response) => {
	if (request.discord_user_id === undefined)
		throw new Error("Missing user ID");

	response.send(await get_guild_info_by_owner(request.discord_user_id));
});
export default router;
