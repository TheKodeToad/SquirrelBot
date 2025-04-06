import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { check, object, optional, pipe, string, transform } from "valibot";
import { case_type_by_id, get_cases, type CaseQuery } from "../../../../../../db/moderation/cases.ts";
import { parse_boolean_schema, parse_int_schema, snowflake_schema } from "../../../../../../schema/common/index.ts";
import type { GuildAuthVars } from "../../../../../middleware/guild_auth.ts";
import { serialise_case_object } from "./index.ts";

const router = new Hono<{ Variables: GuildAuthVars; }>;

const query_schema = pipe(object({
	before: optional(parse_int_schema),
	after: optional(parse_int_schema),
	type: optional(pipe(string(), transform(case_type_by_id), check(id => id !== undefined, "Invalid case type"))),
	"created-before": optional(pipe(parse_int_schema, transform(input => new Date(input)))),
	"created-after": optional(pipe(parse_int_schema, transform(input => new Date(input)))),
	actor: optional(snowflake_schema),
	target: optional(snowflake_schema),
	"delete-message-seconds-lt": optional(parse_int_schema),
	"delete-message-seconds-gt": optional(parse_int_schema),
	"dm-delivered": optional(parse_boolean_schema),
	order: optional(pipe(
		string(),
		check(input => input === "asc" || input === "dec"),
		transform(input => input === "dec")
	)),
	limit: optional(parse_int_schema),
}), transform(input => ({
	number_less_than: input.before,
	number_greater_than: input.after,
	types: input.type !== undefined ? [input.type] : undefined,
	created_before: input["created-before"],
	created_after: input["created-after"],
	actor_ids: input.actor !== undefined ? [input.actor] : undefined,
	target_ids: input.target !== undefined ? [input.target] : undefined,
	delete_message_seconds_less_than: input["delete-message-seconds-lt"],
	delete_message_seconds_greater_than: input["delete-message-seconds-gt"]
} satisfies CaseQuery)));

router.get("/", vValidator("query", query_schema), async context => {
	if (context.var.discord_guild_id === undefined)
		throw new Error("Missing guild ID");

	const result = await get_cases(context.var.discord_guild_id, context.req.valid("query"));
	return context.json(result.map(serialise_case_object));
});

export default router;