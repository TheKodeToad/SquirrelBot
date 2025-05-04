import { formatUserBold } from "../../../common/discord/format.ts";
import { escapeMarkdown } from "../../../common/discord/markdown.ts";
import type { BulkResult } from "./bulkAction.ts";

export function formatBulkSuccess(item: BulkResult["successful"][number]): string {
	return `${formatUserBold(item.user)} ${item.dmDelivered ? "with direct message " : ""}[#${item.caseNumber}]`;
}

export function formatBulkError(item: BulkResult["unsuccessful"][number]): string {
	return `${formatUserBold(item.user)}: ${escapeMarkdown(item.error)}`;
}
