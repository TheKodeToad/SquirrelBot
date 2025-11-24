import type { Awaitable } from "#common/general.ts";
import type {
	ActionContext,
	CommandContext,
	ReplyObject,
} from "#plugin/core/public/command.ts";
import { ActionRow, Divider, TextButton } from "oceanic-component-helper";
import { ComponentTypes } from "oceanic.js";

export interface Paginator<E, K> {
	pageSize: number;
	getKey: (entry: E) => K;
	lookUp: (ctx: ActionContext, query: PaginatorQuery<K>) => Awaitable<E[]>;
	render: (entries: E[]) => Awaitable<ReplyObject>;
}

export interface PaginatorQuery<K> {
	before?: K;
	after?: K;
	limit: number;
	reversed: boolean;
}

export async function respondWithPaginator<E, K>(
	ctx: CommandContext,
	paginator: Paginator<E, K>,
): Promise<void> {
	await ctx.respond(
		await renderPaginator(ctx, paginator, false, undefined, undefined),
	);
}

async function renderPaginator<E, K>(
	ctx: ActionContext,
	paginator: Paginator<E, K>,
	reversed: boolean,
	before: K | undefined,
	after: K | undefined,
): Promise<ReplyObject> {
	const queryResult = await paginator.lookUp(ctx, {
		before,
		after,
		reversed,
		limit: paginator.pageSize + 1,
	});

	const hasMore = queryResult.length > paginator.pageSize;

	if (hasMore) {
		queryResult.splice(queryResult.length - 1, 1);
	}

	if (reversed) {
		queryResult.reverse();
	}

	const reply = await paginator.render(queryResult);

	const prevDisabled =
		after === undefined && (!hasMore || before === undefined);
	const nextDisabled = before === undefined && !hasMore;

	if (!prevDisabled || !nextDisabled) {
		const componentTarget =
			reply.components.length === 1 &&
			reply.components[0]!.type === ComponentTypes.CONTAINER
				? reply.components[0]!.components
				: reply.components;

		componentTarget.push(Divider());
		componentTarget.push(
			ActionRow([
				TextButton("←", "paginator-prev", { disabled: prevDisabled }),
				TextButton("→", "paginator-next", { disabled: nextDisabled }),
			]),
		);
	}

	const parentHandler = reply.componentHandler;

	reply.componentHandler = async (ctx, customID, ...remaining) => {
		if (ctx.originalUserID === ctx.user.id) {
			if (customID === "paginator-prev") {
				const firstItem = queryResult[0];
				const before =
					firstItem !== undefined
						? paginator.getKey(firstItem)
						: undefined;

				await ctx.edit(
					await renderPaginator(
						ctx,
						paginator,
						true,
						before,
						undefined,
					),
				);
				return;
			} else if (customID === "paginator-next") {
				const lastItem = queryResult[queryResult.length - 1];
				const after =
					lastItem !== undefined
						? paginator.getKey(lastItem)
						: undefined;

				await ctx.edit(
					await renderPaginator(
						ctx,
						paginator,
						false,
						undefined,
						after,
					),
				);
				return;
			}
		}

		await parentHandler?.(ctx, customID, ...remaining);
	};

	return reply;
}
