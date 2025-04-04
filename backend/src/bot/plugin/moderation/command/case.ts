import { get_case } from "../../../../db/moderation/cases.ts";
import { Colors } from "../../../common/discord/colors.ts";
import { format_user } from "../../../common/discord/format.ts";
import { permissions_guard } from "../../core/public/command/helper.ts";
import { OptionType, define_command } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";
import { CASE_TYPE_NAME, moderation_config } from "../index.ts";

export const case_command = define_command({
	id: "case",
	options: {
		number: {
			id: ["number", "n"],
			type: OptionType.INTEGER,
			required: true,
			position: 0,
		},
	},
	track_updates: true,

	pre_run: context => permissions_guard(context, moderation_config, permissions => permissions.case_read),
	async run(context, { number }) {
		const info = await get_case(context.guild.id, number);
		if (info === null) {
			await context.respond(`${icons.error} Case #${number} not found!`);
			return;
		}

		const creation_secs = Math.floor(info.created_at.getTime() / 1000);

		await context.respond({
			embeds: [{
				color: Colors.blurple,
				title: `Case #${number}`,
				fields: [
					{
						name: "Created at",
						value: `<t:${creation_secs}> (<t:${creation_secs}:R>)`,
					},
					{
						name: "Type",
						value: CASE_TYPE_NAME[info.type]
					},
					{
						name: "Actor",
						value: await format_user(info.actor_id)
					},
					{
						name: "Target",
						value: await format_user(info.target_id)
					},
					{
						name: "Reason",
						value: info.reason ?? "*None provided*",
					},
				],
			}]
		});
	},
});