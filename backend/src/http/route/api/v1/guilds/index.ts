import { authMiddleware } from "#http/middleware/auth.ts";
import { guildAuthMiddleware } from "#http/middleware/guildAuth.ts";
import config from "#http/route/api/v1/guilds/config.ts";
import moderation from "#http/route/api/v1/guilds/moderation/index.ts";
import { getAPIGuildInfoByOwner } from "#plugin/core/storage/guildInfo.ts";
import { Hono } from "hono";

const guildRouter = new Hono;
guildRouter.use(authMiddleware);
guildRouter.use(guildAuthMiddleware);
guildRouter.route("/moderation", moderation);
guildRouter.route("/config", config);

const router = new Hono;
router.route("/:guildID", guildRouter);
router.get("/", authMiddleware, async context => context.json(await getAPIGuildInfoByOwner(context.var.discordUserID)));
export default router;
