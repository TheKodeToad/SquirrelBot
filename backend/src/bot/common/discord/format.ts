import { DiscordRESTError } from "oceanic.js";
import { getUserCached } from "./cache.ts";

export function formatRESTError(restError: DiscordRESTError) {
	if (restError.resBody !== null
		&& typeof restError.resBody.message === "string") {
		return `API Error ${restError.code}: ${restError.resBody.message}`;
	}

	return `HTTP Error ${restError.status}: ${restError.statusText}`;
}

export async function formatUserTag(id: string) {
	try {
		return (await getUserCached(id)).tag;
	} catch (error) {
		if (!(error instanceof DiscordRESTError))
			throw error;

		return "<unknown>";
	}
}

// TODO: what was I thinking
export async function formatUser(id: string) {
	return `<@${id}> (${await formatUserTag(id)})`;
}
