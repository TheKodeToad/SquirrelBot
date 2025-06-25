import type { BaseContext, CommandContext, ReplyObject } from "#plugin/core/public/discord/command.ts";
import { ActionRow, Divider, TextButton } from "oceanic-component-helper";
import { ComponentTypes } from "oceanic.js";

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

	const prevDisabled = after === undefined && (!hasMore || before === undefined);
	const nextDisabled = before === undefined && !hasMore;

	if (!prevDisabled || !nextDisabled) {
		const componentTarget =
			reply.components.length === 1 && reply.components[0]!.type === ComponentTypes.CONTAINER
				? reply.components[0]!.components
				: reply.components;

		componentTarget.push(Divider());
		componentTarget.push(ActionRow([
			TextButton("←", "paginator-prev", { disabled: prevDisabled }),
			TextButton("→", "paginator-next", { disabled: nextDisabled }),
		]));
	}

	const parentHandler = reply.componentHandler;

	reply.componentHandler = async (context, customID, ...remaining) => {
		if (context.originalUserID === context.user.id) {
			if (customID === "paginator-prev") {
				const firstItem = queryResult[0];
				const before = firstItem !== undefined ? paginator.getKey(firstItem) : undefined;

				await context.edit(await renderPaginator(context, paginator, true, before, undefined));
				return;
			} else if (customID === "paginator-next") {
				const lastItem = queryResult[queryResult.length - 1];
				const after = lastItem !== undefined ? paginator.getKey(lastItem) : undefined;

				await context.edit(await renderPaginator(context, paginator, false, undefined, after));
				return;
			}
		}

		await parentHandler?.(context, customID, ...remaining);
	};

	return reply;
}
