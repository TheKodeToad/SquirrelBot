import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import v1 from "./v1/index.ts";

const router = new Hono;

router.route("/v1", v1);
router.get("/hello", context => context.json("hello world"));
router.all("/*", _ => { throw new HTTPException(404, { message: "API route does not exist" }); });

export default router;
