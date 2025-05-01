import { ButtonStyles, ComponentTypes } from "oceanic.js";
import type { BaseContext, CommandContext, CommandTextButton, ReplyObject } from "../command.ts";

export interface Paginator<E, K> {
	pageSize: number;
	getKey(entry: E): K;
	lookUp(context: BaseContext, query: PaginatorQuery<K>): Promise<E[]>;
	render(entries: E[]): Promise<ReplyObject> | ReplyObject;
}

export interface PaginatorQuery<K> {
	before?: K;
	after?: K;
	limit: number;
	reversed: boolean;
}

export async function respondWithPaginator<E, K>(context: CommandContext, paginator: Paginator<E, K>): Promise<void> {
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

	const prevButton: CommandTextButton = {
		label: "←",
		customID: "paginator-prev",
		type: ComponentTypes.BUTTON,
		style: ButtonStyles.SECONDARY,
		async callback(context) {
			const firstItem = queryResult[0];
			const before = firstItem !== undefined ? paginator.getKey(firstItem) : undefined;

			await context.edit(await renderPaginator(context, paginator, true, before, undefined));
		},
		disabled: after === undefined && (!hasMore || before === undefined)
	};

	const nextButton: CommandTextButton = {
		label: "→",
		customID: "paginator-next",
		type: ComponentTypes.BUTTON,
		style: ButtonStyles.SECONDARY,
		async callback(context) {
			const lastItem = queryResult[queryResult.length - 1];
			const after = lastItem !== undefined ? paginator.getKey(lastItem) : undefined;

			await context.edit(await renderPaginator(context, paginator, false, undefined, after));
		},
		disabled: before === undefined && !hasMore,
	};

	const componentTarget =
		reply.components.length === 1 && reply.components[0]!.type === ComponentTypes.CONTAINER
			? reply.components[0]!.components
			: reply.components;

	componentTarget.push({ type: ComponentTypes.SEPARATOR });
	componentTarget.push({ components: [prevButton, nextButton], type: ComponentTypes.ACTION_ROW });

	return reply;
}
