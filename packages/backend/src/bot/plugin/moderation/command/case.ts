import { Permissions } from "oceanic.js";
import { CaseType, get_case } from "../../../../data/moderation/case";
import { get_tag_or_unknown } from "../../../common/discord";
import { OptionType, define_command } from "../../../core/types/command";

const CASE_TYPE_NAME: { [T in CaseType]: string } = {
	[CaseType.NOTE]: "Note",
	[CaseType.WARN]: "Warn",
	[CaseType.UNWARN]: "Unwarn",
	[CaseType.VOICE_MUTE]: "Voice Mute",
	[CaseType.VOICE_UNMUTE]: "Voice Unmute",
	[CaseType.MUTE]: "Mute",
	[CaseType.UNMUTE]: "Unmute",
	[CaseType.KICK]: "Kick",
	[CaseType.BAN]: "Ban",
	[CaseType.UNBAN]: "Unban"
};

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
	async run(context, { number }) {
		if (!context.guild)
			return;

		if (!context.member?.permissions.has(Permissions.KICK_MEMBERS))
			return;

		const info = await get_case(context.guild.id, number);
		if (info === null) {
			await context.respond(`:x: Case #${number} not found!`);
			return;
		}

		const creation_secs = Math.floor(info.created_at.getTime() / 1000);

		await context.respond(
			`
**:closed_book: Case #${info.number}**

**Type:** ${CASE_TYPE_NAME[info.type]}
**Created at:** <t:${creation_secs}> (<t:${creation_secs}:R>)

**Actor:** <@${info.actor_id}> (${await get_tag_or_unknown(info.actor_id)})
**Target:** <@${info.target_id}> (${await get_tag_or_unknown(info.target_id)})

**Reason:** ${info.reason !== null ? `"${info.reason}"` : "Not provided"}
			`
		);
	},
});