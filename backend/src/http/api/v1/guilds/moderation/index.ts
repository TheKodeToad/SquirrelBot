import { Hono } from "hono";
import cases from "./cases/index.ts";

const router = new Hono;
router.route("/cases", cases);
export default router;
