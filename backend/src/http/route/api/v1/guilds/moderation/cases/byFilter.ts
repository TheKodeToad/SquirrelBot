import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { check, enum_, object, optional, pipe, string, transform } from "valibot";
import { CaseType, getCases, type CaseQuery } from "../../../../../../../db/moderation/cases.ts";
import { parseBooleanSchema, parseIntSchema, snowflakeSchema } from "../../../../../../../schema/common/index.ts";
import type { GuildAuthVars } from "../../../../../../middleware/guildAuth.ts";
import { serializeCaseObject } from "./index.ts";

const router = new Hono<{ Variables: GuildAuthVars; }>;

const querySchema = pipe(object({
	before: optional(parseIntSchema),
	after: optional(parseIntSchema),
	type: optional(pipe(parseIntSchema, enum_(CaseType))),
	"created-before": optional(pipe(parseIntSchema, transform(input => new Date(input)))),
	"created-after": optional(pipe(parseIntSchema, transform(input => new Date(input)))),
	actor: optional(snowflakeSchema),
	target: optional(snowflakeSchema),
	"delete-message-seconds-lt": optional(parseIntSchema),
	"delete-message-seconds-gt": optional(parseIntSchema),
	"dm-delivered": optional(parseBooleanSchema),
	order: optional(pipe(
		string(),
		check(input => input === "asc" || input === "desc"),
		transform(input => input === "desc")
	), "desc"),
	limit: optional(parseIntSchema, "100"),
}), transform(input => ({
	numberLessThan: input.before,
	numberGreaterThan: input.after,
	types: input.type !== undefined ? [input.type] : undefined,
	createdBefore: input["created-before"],
	createdAfter: input["created-after"],
	actorIDs: input.actor !== undefined ? [input.actor] : undefined,
	targetIDs: input.target !== undefined ? [input.target] : undefined,
	deleteMessageSecondsLessThan: input["delete-message-seconds-lt"],
	deleteMessageSecondsGreaterThan: input["delete-message-seconds-gt"],
	reversed: input.order,
	limit: input.limit,
} satisfies CaseQuery)));

router.get("/", vValidator("query", querySchema), async context => {
	if (context.var.discordGuildID === undefined)
		throw new Error("Missing guild ID");

	const result = await getCases(context.var.discordGuildID, context.req.valid("query"));
	return context.json(result.map(serializeCaseObject));
});

export default router;
