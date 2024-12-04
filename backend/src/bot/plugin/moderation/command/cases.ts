import { EmbedField } from "oceanic.js";
import { CASE_TYPE_NAME, moderation_config } from "..";
import { get_cases } from "../../../../db/moderation/cases";
import { Colors } from "../../../common/discord/colors";
import { format_user_tag } from "../../../common/discord/format";
import { escape_markdown } from "../../../common/discord/markdown";
import { icons } from "../../../icons";
import { resolve_permissions } from "../../../permission_resolution";
import { OptionType, define_command } from "../../../types/command";

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
		const config = moderation_config.get(context.guild.id);

		if (config === undefined)
			return;

		const perms = resolve_permissions(config, context.member, context.channel);

		if (!perms.case_read)
			return;

		const cases = await get_cases(
			context.guild.id,
			{
				actor_ids: args.actor !== null ? [args.actor] : undefined,
				target_ids: args.target !== null ? [args.target] : undefined,
				limit: 4,
				reversed: true,
			}
		);

		let filter = "";

		if (args.actor !== null || args.target !== null) {
			if (args.actor)
				filter += ` by <@${args.actor}> (${escape_markdown(await format_user_tag(args.actor))})`;
			if (args.target)
				filter += ` targeting <@${args.target}> (${escape_markdown(await format_user_tag(args.target))})`;
		} else
			filter = " for this server";

		if (cases.length === 0)
			await context.respond(`${icons.error} No cases${filter} found!`);
		else {
			let fields: EmbedField[] = [];

			for (const info of cases) {
				const actor_tag = escape_markdown(await format_user_tag(info.actor_id));
				const target_tag = escape_markdown(await format_user_tag(info.target_id));
				const creation_secs = Math.floor(info.created_at.getTime() / 1000);

				const subfields: [string, string][] = [];
				subfields.push(["Created at", `<t:${creation_secs}> (<t:${creation_secs}:R>)`]);
				subfields.push(["Type", CASE_TYPE_NAME[info.type]]);
				if (args.actor === null)
					subfields.push(["Actor", `<@${info.actor_id}> (${actor_tag})`]);
				if (args.target === null)
					subfields.push(["Target", `<@${info.target_id}> (${target_tag})`]);
				subfields.push(["Reason", info.reason ?? "*None provided*"]);

				fields.push({
					name: "Case #" + info.number,
					value: subfields.map(([name, value]) => `${name}: ${value}`).join("\n")
				});
			}

			await context.respond({
				embeds: [{
					color: Colors.blurple,
					description: "### Cases" + filter,
					fields
				}],
			});
		}
	},
});