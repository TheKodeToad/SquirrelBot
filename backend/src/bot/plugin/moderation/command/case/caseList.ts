import { ComponentTypes } from "oceanic.js";
import { getCases, type CaseInfo } from "../../../../../db/moderation/cases.ts";
import { defineCommand, OptionType, type BaseContext, type CommandContainerComponent, type ReplyObject } from "../../../core/public/command.ts";
import { permissionsGuard } from "../../../core/public/helper/commandGuards.ts";
import { respondWithPaginator, type PaginatorQuery } from "../../../core/public/helper/paginator.ts";
import { resolvePermissions } from "../../../core/public/permissionResolution.ts";
import { formatCaseDescription, formatCaseFields, formatCompactCaseSummary } from "../../helper/format.ts";
import { moderationConfig } from "../../index.ts";

export const caseListCommand = defineCommand({
	name: ["caselist", "casesearch", "cases", "listcases", "searchcases"],
	description: "List and filter moderation cases.",

	options: {
		actorID: {
			type: OptionType.User,
			name: ["actor", "a", "by", "moderator", "mod"],
		},
		targetID: {
			type: OptionType.User,
			name: ["target", "t", "for", "user"],
		},
		compact: {
			type: OptionType.Flag,
			description: "Display more cases but less information about them.",
			name: ["compact", "c"],
		},
	},
	trackUpdates: true,

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.case_read),
	async run(context, args) {
		await respondWithPaginator<CaseInfo, number>(
			context,
			{
				pageSize: args.compact ? 16 : 4,
				getKey: entry => entry.number,
				lookUp: (context, query) => lookUpCases(context, query, args.actorID, args.targetID),
				render: cases => renderCases(cases, args.compact ?? false),
			}
		);
	},
});

async function lookUpCases(
	context: BaseContext,
	query: PaginatorQuery<number>,
	actorID: string | null,
	targetID: string | null
): Promise<CaseInfo[]> {
	const config = moderationConfig.get(context.guild.id);

	if (config === undefined)
		return [];

	const permissions = resolvePermissions(config, context.member, context.channel);

	if (!permissions.case_read)
		return [];

	return await getCases(context.guild.id, {
		actorIDs: actorID !== null ? [actorID] : undefined,
		targetIDs: targetID !== null ? [targetID] : undefined,
		limit: query.limit,
		// default to descending, using ascending when going back
		reversed: !query.reversed,
		numberGreaterThan: query.before,
		numberLessThan: query.after,
	});
}

async function renderCases(cases: CaseInfo[], compact: boolean): Promise<ReplyObject> {
	const container: CommandContainerComponent = {
		components: [],
		type: ComponentTypes.CONTAINER,
	};

	container.components.push({
		content: "## Cases",
		type: ComponentTypes.TEXT_DISPLAY
	});

	if (compact) {
		let content = "";

		for (const info of cases)
			content += await formatCompactCaseSummary(info) + "\n";

		container.components.push({ content, type: ComponentTypes.TEXT_DISPLAY });
	} else {
		for (const info of cases) {
			container.components.push({ type: ComponentTypes.SEPARATOR });

			container.components.push({
				content: await formatCaseDescription(info, false),
				type: ComponentTypes.TEXT_DISPLAY,
			});

			container.components.push({
				content: await formatCaseFields(info),
				type: ComponentTypes.TEXT_DISPLAY,
			});
		}
	}

	return { components: [container] };
}
