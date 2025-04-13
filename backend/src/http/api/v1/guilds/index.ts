import { Hono } from "hono";
import { getGuildInfoByOwner } from "../../../../db/core/guildInfo.ts";
import { authMiddleware } from "../../../middleware/auth.ts";
import { guildAuthMiddleware } from "../../../middleware/guildAuth.ts";
import config from "./config.ts";
import moderation from "./moderation/index.ts";

const guildRouter = new Hono;
guildRouter.use(authMiddleware);
guildRouter.use(guildAuthMiddleware);
guildRouter.route("/moderation", moderation);
guildRouter.route("/config", config);

const router = new Hono;
router.route("/:guildID", guildRouter);
router.get("/", authMiddleware, async context => context.json(await getGuildInfoByOwner(context.var.discordUserID)));
export default router;
