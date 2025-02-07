import { Hono } from "hono";
import auth from "./auth";
import guilds from "./guilds";

const router = new Hono;
router.route("/auth", auth);
router.route("/guilds", guilds);
export default router;
