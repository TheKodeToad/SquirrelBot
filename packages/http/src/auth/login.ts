import { Router } from "express";

const router = Router();
router.get("/", (request, response) => {
	const { code } = request.query;

	if (!(typeof code === "string")) {
		response.status(400).send("Missing code");
		return;
	}

	fetch("");
});
export default router;