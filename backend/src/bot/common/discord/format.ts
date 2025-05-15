import { fetchUserCachedSupressed } from "#bot/common/discord/cachedRequest.ts";
import { escapeMarkdown } from "#bot/common/discord/markdown.ts";
import { DiscordRESTError, type Uncached } from "oceanic.js";

export function formatRESTError(restError: DiscordRESTError): string {
	if (restError.resBody !== null
		&& typeof restError.resBody.message === "string") {
		return `API Error ${restError.code}: ${escapeMarkdown(restError.resBody.message)}`;
	}

	return `HTTP Error ${restError.status}: ${escapeMarkdown(restError.statusText)}`;
}

export async function formatUserTagByID(id: string): Promise<string> {
	return formatUserTag(await fetchUserCachedSupressed(id));
}

export async function formatUserByID(id: string): Promise<string> {
	return formatUser(await fetchUserCachedSupressed(id));
}

export async function formatUserBoldByID(id: string): Promise<string> {
	return formatUserBold(await fetchUserCachedSupressed(id));
}

type UserLike = { id: string; tag: string; } | Uncached;

export function formatUser(user: UserLike): string {
	return `${formatUserTag(user)} (<@${user.id}>)`;
}

export function formatUserBold(user: UserLike): string {
	return `**${formatUserTag(user)}** (<@${user.id}>)`;
}

export function formatUserTag(user: UserLike): string {
	if ("tag" in user)
		return escapeMarkdown(user.tag);
	else
		return "\\<unknown\\>";
}
