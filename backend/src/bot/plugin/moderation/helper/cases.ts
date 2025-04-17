import { dateToUnixSeconds } from "../../../../common/time.ts";
import { CaseType, type CaseInfo } from "../../../../db/moderation/cases.ts";
import { formatUserByID, formatUserTagByID } from "../../../common/discord/format.ts";
import { makeMarkdownQuote } from "../../../common/discord/markdown.ts";

export async function formatCaseSummary(info: CaseInfo): Promise<string> {
	let result: string;

	const target = await formatUserByID(info.targetID);

	switch (info.type) {
		case CaseType.Note: result = `Note added for ${target}`; break;
		case CaseType.Warn: result = `Warned ${target}`; break;
		case CaseType.Unwarn: result = `Unwarned ${target}`; break;
		case CaseType.VoiceMute: result = `Voice-muted ${target}`; break;
		case CaseType.VoiceUnmute: result = `Voice-unmuted ${target}`; break;
		case CaseType.Mute: result = `Muted ${target}`; break;
		case CaseType.Unmute: result = `Unmuted ${target}`; break;
		case CaseType.Kick: result = `Kicked ${target}`; break;
		case CaseType.Ban: result = `Banned ${target}`; break;
		case CaseType.Unban: result = `Unbanned ${target}`; break;
	}

	if (info.expiresAt === null)
		result += " permanently";
	else
		result += " temporarily";

	if (info.reason === null)
		result += ".";
	else
		result += ":\n " + makeMarkdownQuote(info.reason);

	return result;
}

export async function formatCompactCaseSummary(info: CaseInfo): Promise<string> {
	const actor = await formatUserTagByID(info.actorID);
	const target = await formatUserTagByID(info.targetID);

	let result = `<t:${dateToUnixSeconds(info.createdAt)}:d> **#${info.number}:** `;

	switch (info.type) {
		case CaseType.Note: result += `Note added for ${target} by ${actor}`; break;
		case CaseType.Warn: result += `${target} warned by ${actor}`; break;
		case CaseType.Unwarn: result += `${target} unwarned by ${actor}`; break;
		case CaseType.VoiceMute: result += `${target} voice-muted by ${actor}`; break;
		case CaseType.VoiceUnmute: result += `${target} voice-unmuted by ${actor}`; break;
		case CaseType.Mute: result += `${target} muted by ${actor}`; break;
		case CaseType.Unmute: result += `${target} unmuted by ${actor}`; break;
		case CaseType.Kick: result += `${target} kicked by ${actor}`; break;
		case CaseType.Ban: result += `${target} banned by ${actor}`; break;
		case CaseType.Unban: result += `${target} unbanned by ${actor}`; break;
	}

	if (info.reason !== null)
		result += " - " + info.reason;

	return result;
}
