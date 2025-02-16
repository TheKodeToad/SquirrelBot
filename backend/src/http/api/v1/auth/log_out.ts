import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { delete_token } from "../../../../db/api/tokens.ts";

const router = new Hono;
router.get("/", async context => {
	const authorization = context.req.header("Authorization");

	if (authorization === undefined)
		throw new HTTPException(401, { message: "No Authorization header provided" });

	if (!await delete_token(authorization))
		throw new HTTPException(401, { message: "Invalid or expired token" });

	return context.body(null, 204);
});
export default router;
