import { OptionType, type BaseContext, type ReplyObject } from "#plugin/core/discord/public/command.ts";
import { defineCommand } from "#plugin/core/discord/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/discord/public/helper/commandGuards.ts";
import { respondWithPaginator, type PaginatorQuery } from "#plugin/core/discord/public/helper/paginator.ts";
import { resolvePermissions } from "#plugin/core/discord/public/permissionResolution.ts";
import { formatCaseDescription, formatCaseFields, formatCompactCaseSummary } from "#plugin/moderation/discord/helper/format.ts";
import { moderationConfigStore } from "#plugin/moderation/index.ts";
import { getCases, type CaseInfo } from "#plugin/moderation/storage/cases.ts";
import { Container, Divider, Text } from "oceanic-component-helper";

export default defineCommand({
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

	preRun: context => permissionsGuard(context, moderationConfigStore, permissions => permissions.case_read),
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
	const config = moderationConfigStore.get(context.guild.id);

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
	const container = Container([Text("## Cases")]);

	if (compact) {
		let content = "";

		for (const info of cases)
			content += await formatCompactCaseSummary(info) + "\n";

		container.components.push(Text(content));
	} else {
		for (const info of cases) {
			container.components.push(Divider());
			container.components.push(Text(await formatCaseDescription(info, false)));
			container.components.push(Text(await formatCaseFields(info)));
		}
	}

	return { components: [container] };
}
