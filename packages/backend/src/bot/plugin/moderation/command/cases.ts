import { Permissions } from "oceanic.js";
import { CaseType, get_cases } from "../../../../data/moderation/case";
import { format_user_tag } from "../../../common/discord/format";
import { escape_markdown } from "../../../common/discord/markdown";
import { Icons } from "../../../core/icons";
import { OptionType, define_command } from "../../../core/types/command";

const CASE_ICON: { [T in CaseType]: string } = {
	[CaseType.NOTE]: ":pencil:",
	[CaseType.WARN]: "${Icons.warning}",
	[CaseType.UNWARN]: "${Icons.warning}",
	[CaseType.VOICE_MUTE]: ":microphone:",
	[CaseType.VOICE_UNMUTE]: ":microphone:",
	[CaseType.MUTE]: ":mute:",
	[CaseType.UNMUTE]: ":mute:",
	[CaseType.KICK]: ":boot:",
	[CaseType.BAN]: ":hammer:",
	[CaseType.UNBAN]: ":hammer:"
};

const CASE_ACTION: { [T in CaseType]: string } = {
	[CaseType.NOTE]: "added note on",
	[CaseType.WARN]: "warned",
	[CaseType.UNWARN]: "unwarned",
	[CaseType.VOICE_MUTE]: "voice muted",
	[CaseType.VOICE_UNMUTE]: "voice unmuted",
	[CaseType.MUTE]: "muted",
	[CaseType.UNMUTE]: "unmuted",
	[CaseType.KICK]: "kicked",
	[CaseType.BAN]: "banned",
	[CaseType.UNBAN]: "unbanned"
};

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
		if (context.guild === null)
			return;

		if (!context.member?.permissions.has(Permissions.KICK_MEMBERS))
			return;

		const cases = await get_cases(
			context.guild.id,
			args.actor ?? undefined,
			args.target ?? undefined,
			6
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
			await context.respond(`${Icons.error} No cases found${filter}!`);
		else {
			const items = await Promise.all(cases.map(async (info) => {
				const icon = CASE_ICON[info.type];
				const date = Math.floor(info.created_at.getTime() / 1000);
				const actor_tag = escape_markdown(await format_user_tag(info.actor_id));
				const target_tag = escape_markdown(await format_user_tag(info.target_id));

				return `${icon} <t:${date}:d> [#${info.number}] <@${info.actor_id}> (${actor_tag}) ${CASE_ACTION[info.type]} <@${info.target_id}> (${target_tag})`;
			}));

			await context.respond(`**:closed_book: Cases${filter}**\n\n${items.join("\n")}`);
		}
	},
});