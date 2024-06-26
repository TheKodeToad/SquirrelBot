import { Router } from "express";
import { serialise_case_object } from ".";
import { is_snowflake } from "../../../../../common/snowflake";
import { CASE_TYPE_NAME_TO_ID, CaseQuery, get_cases } from "../../../../../data/moderation/cases";
import { async_request_handler } from "../../../../handler";

const router = Router();

router.get("/", async_request_handler(async (request, response) => {
	if (request.discord_guild_id === undefined)
		throw new Error("Missing guild ID");

	const {
		before,
		after,
		type,
		created_before,
		created_after,
		actor,
		target,
		delete_message_seconds_less_than,
		delete_message_seconds_greater_than,
		dm_sent,
		order,
		limit
	} = request.query;

	const query: CaseQuery = {};

	if (typeof before === "string") {
		const before_number = Number(before);

		if (!Number.isSafeInteger(before_number)) {
			response.sendStatus(400);
			return;
		}

		query.number_less_than = before_number;
	}

	if (typeof after === "string") {
		const parsed = Number(after);

		if (!Number.isSafeInteger(parsed)) {
			response.sendStatus(400);
			return;
		}

		query.number_greater_than = parsed;
	}

	if (type !== undefined) {
		query.types = [];

		const types = Array.isArray(type) ? type : [type];
		for (const item of types) {
			if (typeof item !== "string") {
				response.sendStatus(400);
				return;
			}

			const parsed = CASE_TYPE_NAME_TO_ID[item];

			if (parsed === undefined) {
				response.sendStatus(400);
				return;
			}

			query.types.push(parsed);
		}
	}

	if (typeof created_before === "string") {
		const parsed = Number(created_before);

		if (!Number.isSafeInteger(parsed)) {
			response.sendStatus(400);
			return;
		}

		query.created_before = new Date(parsed);
	}

	if (typeof created_after === "string") {
		const parsed = Number(created_after);

		if (!Number.isSafeInteger(parsed)) {
			response.sendStatus(400);
			return;
		}

		query.created_before = new Date(parsed);
	}

	if (actor !== undefined) {
		query.actor_ids = [];

		const actors = Array.isArray(actor) ? actor : [actor];
		for (const item of actors) {
			if (typeof item !== "string") {
				response.sendStatus(400);
				return;
			}

			if (!is_snowflake(item)) {
				response.sendStatus(400);
				return;
			}

			query.actor_ids.push(item);
		}
	}

	if (target !== undefined) {
		query.target_ids = [];

		const targets = Array.isArray(target) ? target : [target];
		for (const item of targets) {
			if (typeof item !== "string") {
				response.sendStatus(400);
				return;
			}

			if (!is_snowflake(item)) {
				response.sendStatus(400);
				return;
			}

			query.target_ids.push(item);
		}
	}

	if (typeof delete_message_seconds_less_than === "string") {
		const parsed = Number(delete_message_seconds_less_than);

		if (!Number.isSafeInteger(parsed)) {
			response.sendStatus(400);
			return;
		}

		query.delete_message_seconds_less_than = parsed;
	} else if (delete_message_seconds_less_than !== undefined) {
		response.sendStatus(400);
		return;
	}

	if (typeof delete_message_seconds_greater_than === "string") {
		const parsed = Number(delete_message_seconds_greater_than);

		if (!Number.isSafeInteger(parsed)) {
			response.sendStatus(400);
			return;
		}

		query.delete_message_seconds_greater_than = parsed;
	} else if (delete_message_seconds_greater_than !== undefined) {
		response.sendStatus(400);
		return;
	}

	if (typeof dm_sent === "string") {
		switch (dm_sent) {
			case "true":
				query.dm_sent = true;
				break;
			case "false":
				query.dm_sent = false;
				break;
			default:
				response.sendStatus(400);
				return;
		}
	} else if (dm_sent !== undefined) {
		response.sendStatus(400);
		return;
	}

	if (typeof order === "string") {
		switch (order) {
			case "asc":
			case "ascending":
				query.reversed = false;
				break;
			case "desc":
			case "descending":
				query.reversed = true;
				break;
			default:
				response.sendStatus(400);
				return;
		}
	} else if (order !== undefined) {
		response.sendStatus(400);
		return;
	}

	if (typeof limit === "string") {
		const limit_number = Number(limit);

		if (!Number.isSafeInteger(limit_number)) {
			response.sendStatus(400);
			return;
		}

		// if limit is specified explicitly, 0 can be used to fetch all
		if (limit_number > 0)
			query.limit = limit_number;
	} else
		query.limit = 1000;

	response.send((await get_cases(request.discord_guild_id, query)).map(serialise_case_object));
}));

export default router;