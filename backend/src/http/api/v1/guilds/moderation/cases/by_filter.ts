import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { serialise_case_object } from ".";
import { is_snowflake } from "../../../../../../common/snowflake";
import { CASE_TYPE_NAME_TO_ID, CaseQuery, get_cases } from "../../../../../../db/moderation/cases";
import { GuildAuthVars } from "../../../../../middleware/guild_auth";

const router = new Hono<{ Variables: GuildAuthVars; }>;

router.get("/", async context => {
	if (context.var.discord_guild_id === undefined)
		throw new Error("Missing guild ID");

	const {
		before,
		after,
		type,
		"created-before": created_before,
		"created-after": created_after,
		actor,
		target,
		"delete-message-seconds-lt": delete_message_seconds_less_than,
		"delete-message-seconds-gt": delete_message_seconds_greater_than,
		"dm-sent": dm_sent,
		order,
		limit
	} = context.req.query();

	const query: CaseQuery = {};

	if (typeof before === "string") {
		const before_number = Number(before);

		if (!Number.isSafeInteger(before_number))
			throw new HTTPException(400);

		query.number_less_than = before_number;
	}

	if (typeof after === "string") {
		const parsed = Number(after);

		if (!Number.isSafeInteger(parsed))
			throw new HTTPException(400);

		query.number_greater_than = parsed;
	}

	if (type !== undefined) {
		query.types = [];

		const types = Array.isArray(type) ? type : [type];
		for (const item of types) {
			if (typeof item !== "string")
				throw new HTTPException(400);

			const parsed = CASE_TYPE_NAME_TO_ID[item];

			if (parsed === undefined)
				throw new HTTPException(400);

			query.types.push(parsed);
		}
	}

	if (typeof created_before === "string") {
		const parsed = Number(created_before);

		if (!Number.isSafeInteger(parsed))
			throw new HTTPException(400);

		query.created_before = new Date(parsed);
	}

	if (typeof created_after === "string") {
		const parsed = Number(created_after);

		if (!Number.isSafeInteger(parsed))
			throw new HTTPException(400);

		query.created_before = new Date(parsed);
	}

	if (actor !== undefined) {
		query.actor_ids = [];

		const actors = Array.isArray(actor) ? actor : [actor];
		for (const item of actors) {
			if (typeof item !== "string")
				throw new HTTPException(400);

			if (!is_snowflake(item))
				throw new HTTPException(400);

			query.actor_ids.push(item);
		}
	}

	if (target !== undefined) {
		query.target_ids = [];

		const targets = Array.isArray(target) ? target : [target];
		for (const item of targets) {
			if (typeof item !== "string")
				throw new HTTPException(400);

			if (!is_snowflake(item))
				throw new HTTPException(400);

			query.target_ids.push(item);
		}
	}

	if (typeof delete_message_seconds_less_than === "string") {
		const parsed = Number(delete_message_seconds_less_than);

		if (!Number.isSafeInteger(parsed))
			throw new HTTPException(400);

		query.delete_message_seconds_less_than = parsed;
	} else if (delete_message_seconds_less_than !== undefined)
		throw new HTTPException(400);

	if (typeof delete_message_seconds_greater_than === "string") {
		const parsed = Number(delete_message_seconds_greater_than);

		if (!Number.isSafeInteger(parsed))
			throw new HTTPException(400);

		query.delete_message_seconds_greater_than = parsed;
	} else if (delete_message_seconds_greater_than !== undefined)
		throw new HTTPException(400);

	if (typeof dm_sent === "string") {
		switch (dm_sent) {
			case "true":
				query.dm_sent = true;
				break;
			case "false":
				query.dm_sent = false;
				break;
			default:
				throw new HTTPException(400);
		}
	} else if (dm_sent !== undefined)
		throw new HTTPException(400);

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
				throw new HTTPException(400);
		}
	} else if (order !== undefined)
		throw new HTTPException(400);

	if (typeof limit === "string") {
		const limit_number = Number(limit);

		if (!Number.isSafeInteger(limit_number))
			throw new HTTPException(400);

		// if limit is specified explicitly, 0 can be used to fetch all
		if (limit_number > 0)
			query.limit = limit_number;
	} else
		query.limit = 20;

	return context.json((await get_cases(context.var.discord_guild_id, query)).map(serialise_case_object));
});

export default router;