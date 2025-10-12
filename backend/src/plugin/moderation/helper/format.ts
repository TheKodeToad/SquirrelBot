import { formatUserBold, formatUserBoldByID, formatUserByID, formatUserTagByID } from "#common/discord/format.ts";
import { escapeMarkdown, makeMarkdownQuote } from "#common/discord/markdown.ts";
import { dateToUnixSecs, humanizeDuration } from "#common/time.ts";
import type { ModActionFailure } from "#plugin/moderation/helper/modAction.ts";
import { ModActionType, type ModActionSuccess } from "#plugin/moderation/public/modAction.ts";
import { type CaseInfo } from "#plugin/moderation/storage/cases.ts";

export function formatModActionSuccess(result: ModActionSuccess): string {
	return `${formatUserBold(result.action.target)} ${result.dmDelivered ? "with direct message " : ""}(case #${result.caseNumber})`;
}

export function formatModActionFailure(result: ModActionFailure): string {
	return `${formatUserBold(result.user)}: ${escapeMarkdown(result.error)}`;
}

function caseExpired(info: CaseInfo, date: number = Date.now()): boolean {
	return info.expiresAt !== null && info.expiresAt.getTime() <= date;
}

function caseSummaryBase(type: ModActionType, target: string): string {
	switch (type) {
	case ModActionType.Note:
		return `Note added for ${target}`;
	case ModActionType.Warn:
		return `Warned ${target}`;
	case ModActionType.Unwarn:
		return `Unwarned ${target}`;
	case ModActionType.VoiceMute:
		return `Voice-muted ${target}`;
	case ModActionType.VoiceUnmute:
		return `Voice-unmuted ${target}`;
	case ModActionType.Timeout:
		return `Timed out ${target}`;
	case ModActionType.ClearTimeout:
		return `Removed timeout from ${target}`;
	case ModActionType.Kick:
		return `Kicked ${target}`;
	case ModActionType.Ban:
		return `Banned ${target}`;
	case ModActionType.Unban:
		return `Unbanned ${target}`;
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

	const target = await formatUserBoldByID(info.targetID);

	let summary = caseSummaryBase(info.type, target);

	if (info.expiresAt === null)
		summary += " permanently";
	else
		summary += ` for ${humanizeDuration(info.expiresAt.getTime() - info.createdAt.getTime())}`;

	if (info.reason === null)
		summary += ".";
	else
		summary += ":\n" + makeMarkdownQuote(info.reason);

	return title + "\n" + summary;
}

export async function formatCaseFields(info: CaseInfo): Promise<string> {
	let result = "";

	result += `**Moderator:** ${await formatUserByID(info.actorID)}\n`;

	const creationSecs = dateToUnixSecs(info.createdAt);
	result += `**Performed At:** <t:${creationSecs}> (<t:${creationSecs}:R>)\n`;


	if (info.expiresAt !== null) {
		const expirySecs = dateToUnixSecs(info.expiresAt);
		result += `**Expires At:** <t:${expirySecs}> (<t:${expirySecs}:R>)\n`;
	}

	return result;
}

export async function formatCompactCaseSummary(info: CaseInfo): Promise<string> {
	const actor = await formatUserTagByID(info.actorID);
	const target = await formatUserTagByID(info.targetID);

	let result = `<t:${dateToUnixSecs(info.createdAt)}:d> `;

	if (caseExpired(info) || info.shadowedBy !== null)
		result += `**~~#${info.number}:~~** `;
	else
		result += `**#${info.number}:** `;

	switch (info.type) {
	case ModActionType.Note:
		result += `Note added for ${target} by ${actor}`;
		break;
	case ModActionType.Warn:
		result += `${target} warned by ${actor}`;
		break;
	case ModActionType.Unwarn:
		result += `${target} unwarned by ${actor}`;
		break;
	case ModActionType.VoiceMute:
		result += `${target} voice-muted by ${actor}`;
		break;
	case ModActionType.VoiceUnmute:
		result += `${target} voice-unmuted by ${actor}`;
		break;
	case ModActionType.Timeout:
		result += `${target} muted by ${actor}`;
		break;
	case ModActionType.ClearTimeout:
		result += `${target} unmuted by ${actor}`;
		break;
	case ModActionType.Kick:
		result += `${target} kicked by ${actor}`;
		break;
	case ModActionType.Ban:
		result += `${target} banned by ${actor}`;
		break;
	case ModActionType.Unban:
		result += `${target} unbanned by ${actor}`;
		break;
	}

	if (info.reason !== null)
		result += " - " + info.reason;

	return result;
}
