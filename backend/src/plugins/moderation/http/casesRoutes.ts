import { Snowflake } from "#common/schemas/general.ts";
import { definePluginGuildRoutes } from "#http/extensionPoints.ts";
import { validate } from "#http/middleware/zod.ts";
import { ModEventType } from "#plugins/moderation/public/modEvent.ts";
import {
	getCase,
	getCases,
	type CaseInfo,
	type CaseQuery,
} from "#plugins/moderation/storage/cases.ts";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

const querySchema = z
	.strictObject({
		before: z.coerce.number().optional(),
		after: z.coerce.number().optional(),
		type: z.pipe(z.coerce.number(), z.enum(ModEventType)),
		"created-before": z.coerce.date().optional(),
		"created-after": z.coerce.date().optional(),
		actor: Snowflake.optional(),
		target: Snowflake.optional(),
		"delete-message-seconds-lt": z.coerce.number().optional(),
		"delete-message-seconds-gt": z.coerce.number().optional(),
		"dm-delivered": z.stringbool().optional(),
		order: z
			.enum(["asc", "desc"])
			.transform((input) => input === "desc")
			.default(false),
		limit: z.coerce.number().default(100),
	})
	.transform(
		(input) =>
			({
				numberLessThan: input.before,
				numberGreaterThan: input.after,
				types: input.type !== undefined ? [input.type] : undefined,
				createdBefore: input["created-before"],
				createdAfter: input["created-after"],
				actorIDs: input.actor !== undefined ? [input.actor] : undefined,
				targetIDs:
					input.target !== undefined ? [input.target] : undefined,
				deleteMessageSecondsLessThan:
					input["delete-message-seconds-lt"],
				deleteMessageSecondsGreaterThan:
					input["delete-message-seconds-gt"],
				reversed: input.order,
				limit: input.limit,
			}) satisfies CaseQuery,
	);

export default definePluginGuildRoutes((squirrelCtx, app) => {
	app.get("/cases/:number{\\d+}", async (ctx) => {
		const number = Number(ctx.req.param("number"));

		if (!Number.isSafeInteger(number)) {
			throw new HTTPException(400, { message: "Bad case number" });
		}

		const info = await getCase(
			squirrelCtx.db,
			ctx.var.discordGuildID,
			number,
		);

		if (info === null) {
			throw new HTTPException(404, { message: "Case not found" });
		}

		return ctx.json(serializeCaseObject(info));
	});

	app.get("/", validate("query", querySchema), async (ctx) => {
		const result = await getCases(
			squirrelCtx.db,
			ctx.var.discordGuildID,
			ctx.req.valid("query"),
		);
		return ctx.json(result.map(serializeCaseObject));
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
	type: ModEventType;
	createdAt: number;
	expiresAt: number | null;
	actorID: string;
	targetID: string;
	reason: string | null;
	deleteMessageSeconds: number | null;
	dmSent: boolean | null;
}
