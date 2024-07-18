import PromiseRouter from "express-promise-router";
import { serialise_case_object } from ".";
import { get_case } from "../../../../../../db/moderation/cases";

const router = PromiseRouter();
router.get("/:number(\\d+)", async (request, response) => {
	if (request.discord_guild_id === undefined)
		throw new Error("Missing guild ID");

	const number = Number(request.params.number);

	if (!Number.isSafeInteger(number)) {
		response.sendStatus(400);
		return;
	}

	const info = await get_case(request.discord_guild_id, number);

	if (info === null) {
		response.sendStatus(404);
		return;
	}

	response.send(serialise_case_object(info));
});
export default router;
