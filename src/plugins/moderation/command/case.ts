import { Permissions } from "oceanic.js";
import { format_user } from "../../../common/user";
import { FlagType, define_command } from "../../../plugin/command";
import { CASE_TYPE_NAME, get_case } from "../common/case";

export const case_command = define_command({
	id: "case",
	flags: {
		number: {
			id: "number",
			type: FlagType.INTEGER,
			primary: true,
			required: true,
		},
	},
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

		await context.respond(
			`
:closed_book: Case #${info.number}:
Type: ${CASE_TYPE_NAME[info.type]}
Created at: ${info.created_at}

Actor: ${await format_user(info.actor_id)}
Target: ${await format_user(info.target_id)}

Reason: ${info.reason !== null ? `"${info.reason}"` : "Not provided"}
			`
		);
	},
});