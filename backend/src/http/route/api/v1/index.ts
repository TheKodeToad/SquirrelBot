import auth from "#http/route/api/v1/auth/index.ts";
import guilds from "#http/route/api/v1/guilds/index.ts";
import { Hono } from "hono";

const router = new Hono;

router.route("/auth", auth);
router.route("/guilds", guilds);

export default router;
