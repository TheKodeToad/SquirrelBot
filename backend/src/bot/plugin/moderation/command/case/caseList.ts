import { type Embed } from "oceanic.js";
import { dateToUnixSeconds } from "../../../../../common/time.ts";
import { getCases, type CaseInfo } from "../../../../../db/moderation/cases.ts";
import { Colors } from "../../../../common/discord/colors.ts";
import { formatUserByID } from "../../../../common/discord/format.ts";
import { defineCommand, OptionType, type BaseContext, type ReplyObject } from "../../../core/public/command.ts";
import { permissionsGuard } from "../../../core/public/helper/commandGuards.ts";
import { respondWithPaginator, type PaginatorQuery } from "../../../core/public/helper/paginator.ts";
import { resolvePermissions } from "../../../core/public/permissionResolution.ts";
import { formatCaseSummary, formatCaseTitle, formatCompactCaseSummary } from "../../helper/cases.ts";
import { moderationConfig } from "../../index.ts";

export const caseListCommand = defineCommand({
	name: ["caselist", "casesearch", "cases", "listcases", "searchcases"],
	options: {
		actorID: {
			name: ["actor", "a", "by", "moderator", "mod"],
			type: OptionType.User,
		},
		targetID: {
			name: ["target", "t", "for", "user"],
			type: OptionType.User,
		},
		compact: {
			name: ["compact", "c"],
			type: OptionType.Flag,
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
				format: cases => formatCases(cases, args.compact ?? false),
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

async function formatCases(cases: CaseInfo[], compact: boolean): Promise<ReplyObject> {
	const embed: Embed = {
		title: "Cases",
		color: Colors.blurple,
	};

	embed.description = "";
	embed.fields = [];

	const now = Date.now();

	for (const info of cases) {
		const expired = info.expiresAt !== null && info.expiresAt.getTime() <= now;

		if (compact)
			embed.description += await formatCompactCaseSummary(info, expired) + "\n";
		else {
			let value = await formatCaseSummary(info) + "\n";

			value += `Moderator: ${await formatUserByID(info.actorID)}\n`;

			const creationSecs = dateToUnixSeconds(info.createdAt);
			value += `Performed At: <t:${creationSecs}> (<t:${creationSecs}:R>)\n`;

			if (info.expiresAt !== null) {
				const expirySecs = dateToUnixSeconds(info.expiresAt);
				value += `Expires At: <t:${expirySecs}> (<t:${expirySecs}:R>)\n`;
			}

			embed.fields.push({
				name: formatCaseTitle(info, expired),
				value
			});
		}
	}

	return { embeds: [embed] };
}