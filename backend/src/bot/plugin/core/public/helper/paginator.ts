import { ButtonStyles, ComponentTypes } from "oceanic.js";
import type { ReplyObject } from "../command.ts";

export interface Query {
	before?: number;
	after?: number;
	limit: number;
	reversed: boolean;
}

export async function makePaginator<E extends { number: number; }>(
	query: Query,
	lookup: (query: Query) => Promise<E[]>,
	format: (entries: E[]) => Promise<ReplyObject>
): Promise<ReplyObject> {
	const queryResult = await lookup({
		...query,
		limit: query.limit + 1
	});

	const hasMore = queryResult.length > query.limit;

	if (hasMore)
		queryResult.splice(queryResult.length - 1, 1);

	if (query.reversed)
		queryResult.reverse();

	const reply = await format(queryResult);

	return {
		...reply,
		components: [
			[{
				type: ComponentTypes.BUTTON,
				label: "←",
				customID: "paginator-prev",
				style: ButtonStyles.SECONDARY,
				async callback(context) {
					await context.edit(await makePaginator({
						before: queryResult[0]?.number,
						limit: query.limit,
						reversed: true,
					}, lookup, format));
				},
				disabled: query.after === undefined && (!hasMore || query.before === undefined)
			},
			{
				type: ComponentTypes.BUTTON,
				label: "→",
				customID: "paginator-next",
				style: ButtonStyles.SECONDARY,
				async callback(context) {
					await context.edit(await makePaginator({
						after: queryResult[queryResult.length - 1]?.number,
						limit: query.limit,
						reversed: false,
					}, lookup, format));
				},
				disabled: query.before === undefined && !hasMore,
			}],
			...(reply.components ?? [])
		]
	};
}
