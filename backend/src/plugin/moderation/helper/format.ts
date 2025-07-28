import { formatUserBold, formatUserBoldByID, formatUserByID, formatUserTagByID } from "#common/discord/format.ts";
import { escapeMarkdown, makeMarkdownQuote } from "#common/discord/markdown.ts";
import { dateToUnixSeconds, humanizeDuration } from "#common/time.ts";
import type { BulkResult } from "#plugin/moderation/discord/helper/bulkAction.ts";
import { CaseType, type CaseInfo } from "#plugin/moderation/storage/cases.ts";

export function formatBulkSuccess(item: BulkResult["successful"][number]): string {
	return `${formatUserBold(item.user)} ${item.dmDelivered ? "with direct message " : ""}(case #${item.caseNumber})`;
}

export function formatBulkError(item: BulkResult["unsuccessful"][number]): string {
	return `${formatUserBold(item.user)}: ${escapeMarkdown(item.error)}`;
}

function caseExpired(info: CaseInfo, date: number = Date.now()): boolean {
	return info.expiresAt !== null && info.expiresAt.getTime() <= date;
}

function caseSummaryBase(type: CaseType, target: string): string {
	switch (type) {
	case CaseType.Note:
		return `Note added for ${target}`;
	case CaseType.Warn:
		return `Warned ${target}`;
	case CaseType.Unwarn:
		return `Unwarned ${target}`;
	case CaseType.VoiceMute:
		return `Voice-muted ${target}`;
	case CaseType.VoiceUnmute:
		return `Voice-unmuted ${target}`;
	case CaseType.Timeout:
		return `Timed out ${target}`;
	case CaseType.ClearTimeout:
		return `Removed timeout from ${target}`;
	case CaseType.Kick:
		return `Kicked ${target}`;
	case CaseType.Ban:
		return `Banned ${target}`;
	case CaseType.Unban:
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
	case CaseType.Note:
		result += `Note added for ${target} by ${actor}`;
		break;
	case CaseType.Warn:
		result += `${target} warned by ${actor}`;
		break;
	case CaseType.Unwarn:
		result += `${target} unwarned by ${actor}`;
		break;
	case CaseType.VoiceMute:
		result += `${target} voice-muted by ${actor}`;
		break;
	case CaseType.VoiceUnmute:
		result += `${target} voice-unmuted by ${actor}`;
		break;
	case CaseType.Timeout:
		result += `${target} muted by ${actor}`;
		break;
	case CaseType.ClearTimeout:
		result += `${target} unmuted by ${actor}`;
		break;
	case CaseType.Kick:
		result += `${target} kicked by ${actor}`;
		break;
	case CaseType.Ban:
		result += `${target} banned by ${actor}`;
		break;
	case CaseType.Unban:
		result += `${target} unbanned by ${actor}`;
		break;
	}

	if (info.reason !== null)
		result += " - " + info.reason;

	return result;
}
