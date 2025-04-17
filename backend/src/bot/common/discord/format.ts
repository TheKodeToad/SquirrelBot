import { DiscordRESTError, Member, User } from "oceanic.js";
import { getUserCached } from "./cache.ts";
import { escapeMarkdown } from "./markdown.ts";

export function formatRESTError(restError: DiscordRESTError) {
	if (restError.resBody !== null
		&& typeof restError.resBody.message === "string") {
		return `API Error ${restError.code}: ${escapeMarkdown(restError.resBody.message)}`;
	}

	return `HTTP Error ${restError.status}: ${escapeMarkdown(restError.statusText)}`;
}

export async function formatUserTagByID(id: string) {
	try {
		return escapeMarkdown((await getUserCached(id)).tag);
	} catch (error) {
		if (!(error instanceof DiscordRESTError))
			throw error;

		return "\\<unknown\\>";
	}
}

export async function formatUserByID(id: string) {
	return `<@${id}> (${await formatUserTagByID(id)})`;
}

export function formatUser(user: User | Member) {
	return `<@${user.id}> (${escapeMarkdown(user.tag)})`;
}
