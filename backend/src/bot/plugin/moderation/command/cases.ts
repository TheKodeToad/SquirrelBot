import { ButtonStyles, ComponentTypes, Member, type AnyTextableGuildChannel, type EmbedField } from "oceanic.js";
import { get_cases } from "../../../../db/moderation/cases.ts";
import { Colors } from "../../../common/discord/colors.ts";
import { format_user, format_user_tag } from "../../../common/discord/format.ts";
import { escape_markdown } from "../../../common/discord/markdown.ts";
import { permissions_guard } from "../../core/public/command/helper.ts";
import { OptionType, define_command, type Component, type Reply } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";
import { resolve_permissions } from "../../core/public/permission_resolution.ts";
import { case_type_name, case_type_name_compact } from "../helper/cases.ts";
import { moderation_config } from "../index.ts";


export const cases_command = define_command({
	name: ["cases"],
	options: {
		actor_id: {
			name: ["actor", "a", "by", "moderator", "mod"],
			type: OptionType.USER,
		},
		target_id: {
			name: ["target", "t", "for", "user"],
			type: OptionType.USER,
		},
		compact: {
			name: ["compact", "c"],
			type: OptionType.FLAG,
		},
	},
	track_updates: true,

	pre_run: context => permissions_guard(context, moderation_config, permissions => permissions.case_read),
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
	actor_id: string | null;
	target_id: string | null;
	compact: boolean;
}

interface State {
	before?: number;
	after?: number;
	reversed?: boolean;
}

async function run(callback: (reply: Reply) => Promise<void>, member: Member, channel: AnyTextableGuildChannel, options: Options, state: State) {
	const config = moderation_config.get(member.guildID);

	if (config === undefined)
		return;

	const perms = resolve_permissions(config, member, channel);

	if (!perms.case_read)
		return;

	const limit = options.compact ? 15 : 3;

	const cases = await get_cases(
		member.guildID,
		{
			actor_ids: options.actor_id !== null ? [options.actor_id] : undefined,
			target_ids: options.target_id !== null ? [options.target_id] : undefined,
			limit: limit + 1,
			// default to descending, using ascending when going back
			reversed: !state.reversed,
			number_greater_than: state.before,
			number_less_than: state.after,
		}
	);

	if (cases.length === 0) {
		await callback(`${icons.info} No cases found!`);
		return;
	}

	const has_more = cases.length === limit + 1;

	if (has_more)
		cases.splice(cases.length - 1, 1);

	// reverse result so it still appears to be descending yet we have the last n instead of first n
	if (state.reversed)
		cases.reverse();

	const has_filters = options.actor_id !== null || options.target_id !== null;
	const title = has_filters ? "Filtered Cases" : "All Cases";

	let description = "";

	if (options.actor_id !== null)
		description += `Actor: ${await format_user(options.actor_id)}\n`;

	if (options.target_id !== null)
		description += `Target: ${await format_user(options.target_id)}\n`;

	let fields: EmbedField[] = [];

	for (const info of cases) {
		const creation_secs = Math.floor(info.created_at.getTime() / 1000);

		if (options.compact) {
			const actor = escape_markdown(await format_user_tag(info.actor_id));
			const target = escape_markdown(await format_user_tag(info.target_id));
			description += `<t:${creation_secs}:R> **#${info.number}:** ${actor} ${case_type_name_compact(info.type)} ${target}`;

			if (info.reason !== null && info.reason.length !== 0)
				description += ` (${info.reason})`;

			description += "\n";
		} else {
			let value = "";
			value += `Created at: <t:${creation_secs}> (<t:${creation_secs}:R>)\n`;
			value += `Type: ${case_type_name(info.type)}\n`;

			if (options.actor_id === null)
				value += `Actor: ${await format_user(info.actor_id)}\n`;

			if (options.target_id === null)
				value += `Target: ${await format_user(info.target_id)}\n`;

			value += `Reason: ${info.reason ?? "*None provided*"}\n`;

			fields.push({ name: "Case #" + info.number, value });
		}
	}

	const components: Component[][] = [];

	const prev_disabled = state.after === undefined && (!has_more || state.before === undefined);
	const next_disabled = state.before === undefined && !has_more;

	if (!(prev_disabled && next_disabled)) {
		components.push([
			{
				type: ComponentTypes.BUTTON,
				style: ButtonStyles.SECONDARY,
				customID: "prev",
				label: "←",
				disabled: prev_disabled,
				callback: component_context => run(reply => component_context.edit(reply), member, channel, options, { before: cases[0]?.number, reversed: true }),
			},
			{
				type: ComponentTypes.BUTTON,
				style: ButtonStyles.SECONDARY,
				customID: "next",
				label: "→",
				disabled: next_disabled,
				callback: component_context => run(reply => component_context.edit(reply), member, channel, options, { after: cases[cases.length - 1]?.number }),
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