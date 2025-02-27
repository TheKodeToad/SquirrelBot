import { ButtonStyles, ComponentTypes, Member, type AnyTextableGuildChannel, type EmbedField } from "oceanic.js";
import { get_cases } from "../../../../db/moderation/cases.ts";
import { Colors } from "../../../common/discord/colors.ts";
import { format_user } from "../../../common/discord/format.ts";
import { OptionType, define_command, type Component, type Reply } from "../../core/public/command.ts";
import { icons } from "../../core/public/icons.ts";
import { resolve_permissions } from "../../core/public/permission_resolution.ts";
import { CASE_TYPE_NAME, moderation_config } from "../index.ts";


export const cases_command = define_command({
	id: "cases",
	options: {
		actor: {
			id: ["actor", "a", "by", "moderator", "mod"],
			type: OptionType.USER,
		},
		target: {
			id: ["target", "t", "for", "user"],
			type: OptionType.USER,
		},
	},
	track_updates: true,
	async run(context, args) {
		await run(reply => context.respond(reply), context.member, context.channel, { actor_id: args.actor, target_id: args.target }, {});
	},
});

interface Filter {
	actor_id: string | null;
	target_id: string | null;
}

interface State {
	before?: number;
	after?: number;
	reversed?: boolean;
}

async function run(callback: (reply: Reply) => Promise<void>, member: Member, channel: AnyTextableGuildChannel, filter: Filter, state: State) {
	const config = moderation_config.get(member.guildID);

	if (config === undefined)
		return;

	const perms = resolve_permissions(config, member, channel);

	if (!perms.case_read)
		return;

	const limit = 3;

	const cases = await get_cases(
		member.guildID,
		{
			actor_ids: filter.actor_id !== null ? [] : undefined,
			target_ids: filter.target_id !== null ? [filter.target_id] : undefined,
			limit: limit + 1,
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

	if (state.reversed)
		cases.reverse();

	const has_filters = filter.actor_id !== null || filter.target_id !== null;
	const title = has_filters ? "Filtered Cases" : "All Cases";

	let description = "";

	if (filter.actor_id !== null)
		description += `Actor: ${await format_user(filter.actor_id)}\n`;

	if (filter.target_id !== null)
		description += `Target: ${await format_user(filter.target_id)}\n`;

	let fields: EmbedField[] = [];

	for (const info of cases) {
		const creation_secs = Math.floor(info.created_at.getTime() / 1000);

		let value = "";
		value += `Created at: <t:${creation_secs}> (<t:${creation_secs}:R>)\n`;
		value += `Type: ${CASE_TYPE_NAME[info.type]}\n`;

		if (filter.actor_id === null)
			value += `Actor: ${await format_user(info.actor_id)}\n`;

		if (filter.target_id === null)
			value += `Target: ${await format_user(info.target_id)}\n`;

		value += `Reason: ${info.reason ?? "*None provided*"}\n`;

		fields.push({ name: "Case #" + info.number, value });
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
				callback: component_context => run(reply => component_context.edit(reply), member, channel, filter, { before: cases[0]?.number, reversed: true }),
			},
			{
				type: ComponentTypes.BUTTON,
				style: ButtonStyles.SECONDARY,
				customID: "next",
				label: "→",
				disabled: next_disabled,
				callback: component_context => run(reply => component_context.edit(reply), member, channel, filter, { after: cases[cases.length - 1]?.number }),
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