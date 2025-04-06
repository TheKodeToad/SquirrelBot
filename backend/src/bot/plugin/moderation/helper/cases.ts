import { CaseType } from "../../../../db/moderation/cases.ts";

export function case_type_name(type: CaseType): string {
	switch (type) {
		case CaseType.Note:
			return "Note";
		case CaseType.Warn:
			return "Warn";
		case CaseType.Unwarn:
			return "Unwarn";
		case CaseType.VoiceMute:
			return "VoiceMute";
		case CaseType.VoiceUnmute:
			return "VoiceUnmute";
		case CaseType.Mute:
			return "Mute";
		case CaseType.Unmute:
			return "Unmute";
		case CaseType.Kick:
			return "Kick";
		case CaseType.Ban:
			return "Ban";
		case CaseType.Unban:
			return "Unban";
	}
}

export function case_type_name_compact(type: CaseType): string {
	switch (type) {
		case CaseType.Note:
			return "added note to";
		case CaseType.Warn:
			return "warned";
		case CaseType.Unwarn:
			return "unwarned";
		case CaseType.VoiceMute:
			return "voice-muted";
		case CaseType.VoiceUnmute:
			return "voice-unmuted";
		case CaseType.Mute:
			return "muted";
		case CaseType.Unmute:
			return "unmuted";
		case CaseType.Kick:
			return "kicked";
		case CaseType.Ban:
			return "banned";
		case CaseType.Unban:
			return "unbanned";
	}
}