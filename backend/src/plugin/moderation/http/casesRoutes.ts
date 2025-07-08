import { Snowflake } from "#common/schema/general.ts";
import { definePluginGuildRoutes } from "#interface/http/extensionPoints.ts";
import { CaseType, getCase, getCases, type CaseInfo, type CaseQuery } from "#plugin/moderation/storage/cases.ts";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod/v4";

const querySchema = z.strictObject({
	before: z.coerce.number().optional(),
	after: z.coerce.number().optional(),
	type: z.pipe(z.coerce.number(), z.enum(CaseType)),
	"created-before": z.coerce.date().optional(),
	"created-after": z.coerce.date().optional(),
	actor: Snowflake.optional(),
	target: Snowflake.optional(),
	"delete-message-seconds-lt": z.coerce.number().optional(),
	"delete-message-seconds-gt": z.coerce.number().optional(),
	"dm-delivered": z.stringbool().optional(),
	order: z.enum(["asc", "desc"]).transform(input => input === "desc").default(false),
	limit: z.coerce.number().default(100),
}).transform(input => ({
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
} satisfies CaseQuery));

export default definePluginGuildRoutes(app => {
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

	app.get("/", zValidator("query", querySchema), async context => {
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
