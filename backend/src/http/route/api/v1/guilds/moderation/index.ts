import cases from "#http/route/api/v1/guilds/moderation/cases/index.ts";
import { Hono } from "hono";

const router = new Hono;
router.route("/cases", cases);
export default router;
