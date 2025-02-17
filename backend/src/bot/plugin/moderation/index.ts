import { CaseType } from "../../../db/moderation/cases.ts";
import { moderation_config_schema } from "../../../schema/moderation.ts";
import { define_plugin } from "../../loader/types/plugin.ts";
import { ConfigCache } from "../core/public/config.ts";
import { ban_command } from "./command/ban.ts";
import { case_command } from "./command/case.ts";
import { cases_command } from "./command/cases.ts";
import { kick_command } from "./command/kick.ts";
import { purge_command } from "./command/purge.ts";
import { unban_command } from "./command/unban.ts";

export const moderation_config = new ConfigCache(moderation_config_schema);

export const moderation_plugin = define_plugin({
	id: "moderation",
	config: moderation_config,
	commands: [ban_command, unban_command, kick_command, case_command, cases_command, purge_command],
});

export const CASE_ICON: { [T in CaseType]: string } = {
	[CaseType.Note]: ":pencil:",
	[CaseType.Warn]: ":warning:",
	[CaseType.Unwarn]: ":warning:",
	[CaseType.VoiceMute]: ":microphone:",
	[CaseType.VoiceUnmute]: ":microphone:",
	[CaseType.Mute]: ":mute:",
	[CaseType.Unmute]: ":mute:",
	[CaseType.Kick]: ":boot:",
	[CaseType.Ban]: ":hammer:",
	[CaseType.Unban]: ":hammer:"
};

export const CASE_TYPE_NAME: { [T in CaseType]: string } = {
	[CaseType.Note]: "Note",
	[CaseType.Warn]: "Warn",
	[CaseType.Unwarn]: "Unwarn",
	[CaseType.VoiceMute]: "Voice Mute",
	[CaseType.VoiceUnmute]: "Voice Unmute",
	[CaseType.Mute]: "Mute",
	[CaseType.Unmute]: "Unmute",
	[CaseType.Kick]: "Kick",
	[CaseType.Ban]: "Ban",
	[CaseType.Unban]: "Unban"
};