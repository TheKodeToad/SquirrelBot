import { fetchUserCachedSupressed } from "#common/discord/cachedRequest.ts";
import { escapeMarkdown } from "#common/discord/markdown.ts";
import { Client, DiscordRESTError, Member, User, UserFlags, type Uncached } from "oceanic.js";

export function formatRESTError(restError: DiscordRESTError): string {
	if (restError.resBody !== null
		&& typeof restError.resBody.message === "string") {
		return `API Error ${restError.code}: ${escapeMarkdown(restError.resBody.message)}`;
	}

	return `HTTP Error ${restError.status}: ${escapeMarkdown(restError.statusText)}`;
}

export async function formatUserTagByID(bot: Client, id: string): Promise<string> {
	return formatUserTag(await fetchUserCachedSupressed(bot, id));
}

export async function formatUserByID(bot: Client, id: string): Promise<string> {
	return formatUser(await fetchUserCachedSupressed(bot, id));
}

export async function formatUserBoldByID(bot: Client, id: string): Promise<string> {
	return formatUserBold(await fetchUserCachedSupressed(bot, id));
}

type UserLike = { id: string; tag: string; } | Uncached;

export function formatUser(user: UserLike): string {
	return `${formatUserTag(user)} (<@${user.id}>)`;
}

export function formatUserBold(user: UserLike): string {
	return `**${formatUserTag(user)}** (<@${user.id}>)`;
}

export function formatUserTag(user: UserLike): string {
	if ("tag" in user) {
		return escapeMarkdown(user.tag);
	}
	else {
		return "\\<unknown\\>";
	}
}

/** This should be used in user lookup commands to nicely present information next to the name which otherwise would be displayed elsewhere. */
export function formatUserTagRich(user: User | Member): string {
	if ("user" in user) {
		user = user.user;
	}

	let result = escapeMarkdown(user.tag || user.globalName || "<unknown>");

	if (user.clan !== null) {
		result += " \\[" + escapeMarkdown(user.clan.tag) + "\\]";
	}

	if (user.system) {
		result += " \\[SYSTEM\\]";
	}
	else if (user.bot) {
		if (user.publicFlags & UserFlags.VERIFIED_BOT) {
			result += " \\[✔\u8201APP]\\";
		}
		else {
			result += " \\[APP\\]";
		}
	}

	return result;
}
