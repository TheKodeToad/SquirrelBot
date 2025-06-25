import { parseBooleanSchema, parseIntSchema, Snowflake } from "#common/schema/general.ts";
import { definePluginRoutes } from "#interface/http/extensionPoints.ts";
import { CaseType, getCase, getCases, type CaseInfo, type CaseQuery } from "#plugin/moderation/storage/cases.ts";
import { vValidator } from "@hono/valibot-validator";
import { HTTPException } from "hono/http-exception";
import { check, enum_, object, optional, pipe, string, transform } from "valibot";

const querySchema = pipe(object({
	before: optional(parseIntSchema),
	after: optional(parseIntSchema),
	type: optional(pipe(parseIntSchema, enum_(CaseType))),
	"created-before": optional(pipe(parseIntSchema, transform(input => new Date(input)))),
	"created-after": optional(pipe(parseIntSchema, transform(input => new Date(input)))),
	actor: optional(Snowflake),
	target: optional(Snowflake),
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

export default definePluginRoutes(app => {
	app.get("/cases/:number{\\d+}", async context => {
		if (context.var.discordGuildID === undefined)
			throw new Error("Missing guild ID");

		const number = Number(context.req.param("number"));

		if (!Number.isSafeInteger(number))
			throw new HTTPException(400);

		const info = await getCase(context.var.discordGuildID, number);

		if (info === null)
			throw new HTTPException(400);

		return context.json(serializeCaseObject(info));
	});

	app.get("/", vValidator("query", querySchema), async context => {
		if (context.var.discordGuildID === undefined)
			throw new Error("Missing guild ID");

		const result = await getCases(context.var.discordGuildID, context.req.valid("query"));
		return context.json(result.map(serializeCaseObject));
	});
});

function serializeCaseObject(info: CaseInfo): SerializedCaseObject {
	return {
		number: info.number,
		type: info.type,
		createdAt: info.createdAt.getTime(),
		expiresAt: info.expiresAt?.getTime() ?? null,
		actorID: info.actorID,
		targetID: info.targetID,
		reason: info.reason,
		deleteMessageSeconds: info.deleteMessageSeconds,
		dmSent: info.dmDelivered,
	};
}

interface SerializedCaseObject {
	number: number;
	type: CaseType;
	createdAt: number;
	expiresAt: number | null;
	actorID: string;
	targetID: string;
	reason: string | null;
	deleteMessageSeconds: number | null;
	dmSent: boolean | null;
}
