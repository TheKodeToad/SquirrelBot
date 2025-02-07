import { Hono } from "hono";
import { get_guild_info_by_owner } from "../../../../db/core/guild_info";
import { auth_middleware } from "../../../middleware/auth";
import { guild_auth_middleware } from "../../../middleware/guild_auth";
import config from "./config";
import moderation from "./moderation";

const guild_router = new Hono;
guild_router.use(auth_middleware);
guild_router.use(guild_auth_middleware);
guild_router.route("/moderation", moderation);
guild_router.route("/config", config);

const router = new Hono;
router.route("/:guild_id", guild_router);
router.get("/", auth_middleware, async context => context.json(await get_guild_info_by_owner(context.var.discord_user_id)));
export default router;
