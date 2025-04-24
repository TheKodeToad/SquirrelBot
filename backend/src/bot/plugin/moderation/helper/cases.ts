import { dateToUnixSeconds } from "../../../../common/time.ts";
import { CaseType, type CaseInfo } from "../../../../db/moderation/cases.ts";
import { formatUserByID, formatUserTagByID } from "../../../common/discord/format.ts";
import { makeMarkdownQuote } from "../../../common/discord/markdown.ts";


export function caseExpired(info: CaseInfo, date: number = Date.now()) {
	return info.expiresAt !== null && info.expiresAt.getTime() <= date;
}

function caseSummaryBase(type: CaseType, target: string) {
	switch (type) {
		case CaseType.Note: return `Note added for ${target}`; break;
		case CaseType.Warn: return `Warned ${target}`; break;
		case CaseType.Unwarn: return `Unwarned ${target}`; break;
		case CaseType.VoiceMute: return `Voice-muted ${target}`; break;
		case CaseType.VoiceUnmute: return `Voice-unmuted ${target}`; break;
		case CaseType.Mute: return `Muted ${target}`; break;
		case CaseType.Unmute: return `Unmuted ${target}`; break;
		case CaseType.Kick: return `Kicked ${target}`; break;
		case CaseType.Ban: return `Banned ${target}`; break;
		case CaseType.Unban: return `Unbanned ${target}`; break;
	}
}

export async function formatCaseDescription(info: CaseInfo, bigTitle: boolean): Promise<string> {
	let title = "Case #" + info.number;

	if (info.shadowedBy !== null)
		title = `~~${title}~~ (refined or reversed by #${info.shadowedBy})`;
	else if (caseExpired(info))
		title = `~~${title}~~ (expired)`;

	if (bigTitle)
		title = "## " + title;
	else
		title = "### " + title;

	const target = await formatUserByID(info.targetID);

	let summary = caseSummaryBase(info.type, target);

	if (info.expiresAt === null)
		summary += " permanently";
	else
		summary += " temporarily";

	if (info.reason === null)
		summary += ".";
	else
		summary += ":\n" + makeMarkdownQuote(info.reason);

	return title + "\n" + summary;
}

export async function formatCaseFields(info: CaseInfo): Promise<string> {
	let result = "";

	result += `**Moderator:** ${await formatUserByID(info.actorID)}\n`;

	const creationSecs = dateToUnixSeconds(info.createdAt);
	result += `**Performed At:** <t:${creationSecs}> (<t:${creationSecs}:R>)\n`;


	if (info.expiresAt !== null) {
		const expirySecs = dateToUnixSeconds(info.expiresAt);
		result += `**Expires At:** <t:${expirySecs}> (<t:${expirySecs}:R>)\n`;
	}

	return result;
}


export async function formatCompactCaseSummary(info: CaseInfo): Promise<string> {
	const actor = await formatUserTagByID(info.actorID);
	const target = await formatUserTagByID(info.targetID);

	let result = `<t:${dateToUnixSeconds(info.createdAt)}:d> `;

	if (caseExpired(info) || info.shadowedBy !== null)
		result += `**~~#${info.number}:~~** `;
	else
		result += `**#${info.number}:** `;

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
