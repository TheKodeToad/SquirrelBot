import { Permissions } from "oceanic.js";
import { format_user } from "../../../common/discord";
import { OptionType, define_command } from "../../../core/types/command";
import { CASE_TYPE_NAME, get_case } from "../common/case";

export const case_command = define_command({
	id: "case",
	options: {
		number: {
			id: "number",
			type: OptionType.INTEGER,
			required: true,
			position: 0,
		},
	},
	track_updates: true,
	async run(context, { number }) {
		if (!context.guild)
			return;

		if (!context.member?.permissions.has(Permissions.KICK_MEMBERS))
			return;

		const info = await get_case(context.guild.id, number);
		if (info === null) {
			await context.respond(`:x: Case #${number} not found`);
			return;
		}

		const creation_secs = Math.floor(info.created_at.getTime() / 1000);

		await context.respond(
			`
**:closed_book: Case #${info.number}**

**Type:** ${CASE_TYPE_NAME[info.type]}
**Created at:** <t:${creation_secs}> (<t:${creation_secs}:R>)

**Actor:** ${await format_user(info.actor_id)}
**Target:** ${await format_user(info.target_id)}

**Reason:** ${info.reason !== null ? `"${info.reason}"` : "Not provided"}
			`
		);
	},
});