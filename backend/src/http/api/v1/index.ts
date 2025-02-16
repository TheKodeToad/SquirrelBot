import { Hono } from "hono";
import auth from "./auth/index.ts";
import guilds from "./guilds/index.ts";

const router = new Hono;
router.route("/auth", auth);
router.route("/guilds", guilds);
export default router;
