import { CaseType } from "../../../data/moderation/cases";
import { define_plugin } from "../../core/types/plugin";
import { ban_command } from "./command/ban";
import { case_command } from "./command/case";
import { cases_command } from "./command/cases";
import { kick_command } from "./command/kick";
import { purge_command } from "./command/purge";
import { unban_command } from "./command/unban";

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

export const moderation_plugin = define_plugin({
	id: "moderation",
	commands: [ban_command, unban_command, kick_command, case_command, cases_command, purge_command],
});
