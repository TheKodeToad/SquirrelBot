import { Router } from "express";
import { CASE_TYPE_ID_TO_NAME, get_case } from "../../../../../data/moderation/cases";
import { async_request_handler } from "../../../../handler";

const router = Router();

router.get("/:number(\\d+)", async_request_handler(async (request, response) => {
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

	response.send({
		type: CASE_TYPE_ID_TO_NAME[info.type],
		created_at: info.created_at.getTime(),
		expires_at: info.expires_at?.getTime(),
		actor_id: info.actor_id,
		target_id: info.target_id,
		reason: info.reason,
		delete_message_seconds: info.delete_message_seconds,
		dm_sent: info.dm_sent,
	});
}));

export default router;
