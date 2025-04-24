import { ButtonStyles, ComponentTypes, type ButtonComponent } from "oceanic.js";
import type { BaseContext, CommandContext, ReplyObject } from "../command.ts";

export interface Paginator<E, K> {
	pageSize: number;
	getKey(entry: E): K;
	lookUp(context: BaseContext, query: PaginatorQuery<K>): Promise<E[]>;
	render(entries: E[]): Promise<ReplyObject>;
}

export interface PaginatorQuery<K> {
	before?: K;
	after?: K;
	limit: number;
	reversed: boolean;
}

export async function respondWithPaginator<E, K>(context: CommandContext, paginator: Paginator<E, K>) {
	await context.respond(await renderPaginator(context, paginator, false, undefined, undefined));
}

async function renderPaginator<E, K>(
	context: BaseContext,
	paginator: Paginator<E, K>,
	reversed: boolean,
	before: K | undefined,
	after: K | undefined
): Promise<ReplyObject> {
	const queryResult = await paginator.lookUp(context, {
		before,
		after,
		reversed,
		limit: paginator.pageSize + 1
	});

	const hasMore = queryResult.length > paginator.pageSize;

	if (hasMore)
		queryResult.splice(queryResult.length - 1, 1);

	if (reversed)
		queryResult.reverse();

	const reply = await paginator.render(queryResult);

	const prevButton: ButtonComponent = {
		type: ComponentTypes.BUTTON,
		label: "←",
		customID: "paginator-prev",
		style: ButtonStyles.SECONDARY,
		// async callback(context) {
		// 	const firstItem = queryResult[0];
		// 	const before = firstItem !== undefined ? paginator.getKey(firstItem) : undefined;

		// 	await context.edit(await renderPaginator(context, paginator, true, before, undefined));
		// },
		disabled: after === undefined && (!hasMore || before === undefined)
	};

	const nextButton: ButtonComponent = {
		type: ComponentTypes.BUTTON,
		label: "→",
		customID: "paginator-next",
		style: ButtonStyles.SECONDARY,
		// async callback(context) {
		// 	const lastItem = queryResult[queryResult.length - 1];
		// 	const after = lastItem !== undefined ? paginator.getKey(lastItem) : undefined;

		// 	await context.edit(await renderPaginator(context, paginator, false, undefined, after));
		// },
		disabled: before === undefined && !hasMore,
	};

	return {
		...reply,
		components: [
			...(reply.components ?? []),
			{ components: [prevButton, nextButton], type: ComponentTypes.ACTION_ROW }
		]
	};
}
