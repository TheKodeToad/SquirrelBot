import { DiscordRESTError, Permissions } from "oceanic.js";
import { escape_all } from "../../../common/markdown";
import { get_user_cached } from "../../../common/rest";
import { FlagType, define_command } from "../../../plugin/types";
import { CaseType, get_case_by_number } from "../common/case";

const case_string: { [T in CaseType]: string } = {
	[CaseType.NOTE]: ":pencil: Note",
	[CaseType.WARN]: ":warning: Warn",
	[CaseType.UNWARN]: ":warning: Unwarn",
	[CaseType.VOICE_MUTE]: ":mute: Voice Mute",
	[CaseType.VOICE_UNMUTE]: ":mute: Voice Unmute",
	[CaseType.MUTE]: ":microphone2: Mute",
	[CaseType.UNMUTE]: ":microphone2: Unmute",
	[CaseType.KICK]: ":boot: Kick",
	[CaseType.BAN]: ":hammer: Ban",
	[CaseType.UNBAN]: ":hammer: Unban"
};

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

		if (!context.member?.permissions?.has(Permissions.KICK_MEMBERS))
			return;

		const found_case = await get_case_by_number(context.guild.id, number);
		if (found_case === null) {
			await context.respond(`:x: Case #${number} not found`);
			return;
		}

		let actor_name = "<unknown>";
		let target_name = "<unknown>";

		try {
			actor_name = (await get_user_cached(context.client, found_case.actor_id)).tag;
			target_name = (await get_user_cached(context.client, found_case.target_id)).tag;
		} catch (error) {
			if (!(error instanceof DiscordRESTError))
				throw error;
		}

		await context.respond(
			`
**:closed_book: Case #${found_case.number}**

Type: ${case_string[found_case.type]}
Created at: ${found_case.created_at}

Actor: <@${found_case.actor_id}> (${escape_all(actor_name)})
Target: <@${found_case.target_id}> (${escape_all(target_name)})

Reason: ${found_case.reason !== null ? `"${found_case.reason}"` : "Not provided"}
			`
		);
	},
});