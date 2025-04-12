import { ButtonStyles, ComponentTypes, Member, type AnyTextableGuildChannel, type EmbedField } from "oceanic.js";
import { getCases } from "../../../../db/moderation/cases.ts";
import { Colors } from "../../../common/discord/colors.ts";
import { formatUser, formatUserTag } from "../../../common/discord/format.ts";
import { escapeMarkdown } from "../../../common/discord/markdown.ts";
import { permissionsGuard } from "../../core/public/command/helper.ts";
import { defineCommand, OptionType, type Component, type Reply } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";
import { resolvePermissions } from "../../core/public/permission_resolution.ts";
import { caseTypeName, caseTypeNameCompact } from "../helper/cases.ts";
import { moderationConfig } from "../index.ts";

export const casesCommand = defineCommand({
	name: ["cases"],
	options: {
		actorID: {
			name: ["actor", "a", "by", "moderator", "mod"],
			type: OptionType.USER,
		},
		targetID: {
			name: ["target", "t", "for", "user"],
			type: OptionType.USER,
		},
		compact: {
			name: ["compact", "c"],
			type: OptionType.FLAG,
		},
	},
	trackUpdates: true,

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.case_read),
	async run(context, args) {
		await run(
			async reply => await context.respond(reply),
			context.member,
			context.channel,
			{ ...args, compact: args.compact ?? false },
			{}
		);
	},
});

interface Options {
	actorID: string | null;
	targetID: string | null;
	compact: boolean;
}

interface State {
	before?: number;
	after?: number;
	reversed?: boolean;
}

async function run(callback: (reply: Reply) => Promise<void>, member: Member, channel: AnyTextableGuildChannel, options: Options, state: State) {
	const config = moderationConfig.get(member.guildID);

	if (config === undefined)
		return;

	const perms = resolvePermissions(config, member, channel);

	if (!perms.case_read)
		return;

	const limit = options.compact ? 15 : 3;

	const cases = await getCases(
		member.guildID,
		{
			actorIDs: options.actorID !== null ? [options.actorID] : undefined,
			targetIDs: options.targetID !== null ? [options.targetID] : undefined,
			limit: limit + 1,
			// default to descending, using ascending when going back
			reversed: !state.reversed,
			numberGreaterThan: state.before,
			numberLessThan: state.after,
		}
	);

	if (cases.length === 0) {
		await callback(`${icons.info} No cases found!`);
		return;
	}

	const hasMore = cases.length === limit + 1;

	if (hasMore)
		cases.splice(cases.length - 1, 1);

	// reverse result so it still appears to be descending yet we have the last n instead of first n
	if (state.reversed)
		cases.reverse();

	const hasFilters = options.actorID !== null || options.targetID !== null;
	const title = hasFilters ? "Filtered Cases" : "All Cases";

	let description = "";

	if (options.actorID !== null)
		description += `Actor: ${await formatUser(options.actorID)}\n`;

	if (options.targetID !== null)
		description += `Target: ${await formatUser(options.targetID)}\n`;

	let fields: EmbedField[] = [];

	for (const info of cases) {
		const creationSecs = Math.floor(info.created_at.getTime() / 1000);

		if (options.compact) {
			const actor = escapeMarkdown(await formatUserTag(info.actor_id));
			const target = escapeMarkdown(await formatUserTag(info.target_id));
			description += `<t:${creationSecs}:R> **#${info.number}:** ${actor} ${caseTypeNameCompact(info.type)} ${target}`;

			if (info.reason !== null && info.reason.length !== 0)
				description += ` (${info.reason})`;

			description += "\n";
		} else {
			let value = "";
			value += `Created at: <t:${creationSecs}> (<t:${creationSecs}:R>)\n`;
			value += `Type: ${caseTypeName(info.type)}\n`;

			if (options.actorID === null)
				value += `Actor: ${await formatUser(info.actor_id)}\n`;

			if (options.targetID === null)
				value += `Target: ${await formatUser(info.target_id)}\n`;

			value += `Reason: ${info.reason ?? "*None provided*"}\n`;

			fields.push({ name: "Case #" + info.number, value });
		}
	}

	const components: Component[][] = [];

	const prevDisabled = state.after === undefined && (!hasMore || state.before === undefined);
	const nextDisabled = state.before === undefined && !hasMore;

	if (!(prevDisabled && nextDisabled)) {
		components.push([
			{
				type: ComponentTypes.BUTTON,
				style: ButtonStyles.SECONDARY,
				customID: "prev",
				label: "←",
				disabled: prevDisabled,
				callback: componentContext => run(reply => componentContext.edit(reply), member, channel, options, { before: cases[0]?.number, reversed: true }),
			},
			{
				type: ComponentTypes.BUTTON,
				style: ButtonStyles.SECONDARY,
				customID: "next",
				label: "→",
				disabled: nextDisabled,
				callback: componentContext => run(reply => componentContext.edit(reply), member, channel, options, { after: cases[cases.length - 1]?.number }),
			}
		]);
	}

	await callback({
		embeds: [{
			color: Colors.blurple,
			title,
			description,
			fields
		}],
		components
	});
}