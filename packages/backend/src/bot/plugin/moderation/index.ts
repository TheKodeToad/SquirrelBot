import { CaseType } from "../../../data/moderation/case";
import { define_plugin } from "../../core/types/plugin";
import { ban_command } from "./command/ban";
import { case_command } from "./command/case";
import { cases_command } from "./command/cases";
import { kick_command } from "./command/kick";
import { sweep_command } from "./command/sweep";
import { unban_command } from "./command/unban";

export const CASE_ICON: { [T in CaseType]: string } = {
	[CaseType.NOTE]: ":pencil:",
	[CaseType.WARN]: ":warning:",
	[CaseType.UNWARN]: ":warning:",
	[CaseType.VOICE_MUTE]: ":microphone:",
	[CaseType.VOICE_UNMUTE]: ":microphone:",
	[CaseType.MUTE]: ":mute:",
	[CaseType.UNMUTE]: ":mute:",
	[CaseType.KICK]: ":boot:",
	[CaseType.BAN]: ":hammer:",
	[CaseType.UNBAN]: ":hammer:"
};

export const CASE_TYPE_NAME: { [T in CaseType]: string } = {
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

export const moderation_plugin = define_plugin({
	id: "moderation",
	commands: [ban_command, unban_command, kick_command, case_command, cases_command, sweep_command],
});
