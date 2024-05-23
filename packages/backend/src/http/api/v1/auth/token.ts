import { Router } from "express";
import { validate_token } from "../../../../data/api/token";

const router = Router();
router.get("/", async (request, response) => {
	const { authorization } = request.headers;

	if (authorization === undefined) {
		response.sendStatus(401);
		return;
	}

	const user_id = await validate_token(authorization);

	if (user_id === null) {
		response.sendStatus(401);
		return;
	}

	response.send({ user_id });
});
export default router;