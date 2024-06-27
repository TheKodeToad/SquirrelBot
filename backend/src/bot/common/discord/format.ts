import { DiscordRESTError } from "oceanic.js";
import { get_user_cached } from "./cache";

export function format_rest_error(rest_error: DiscordRESTError) {
	if (rest_error.resBody !== null
		&& typeof rest_error.resBody.message === "string") {
		return `API Error ${rest_error.code}: ${rest_error.resBody.message}`;
	}

	return `HTTP Error ${rest_error.status}: ${rest_error.statusText}`;
}

export async function format_user_tag(id: string) {
	try {
		return (await get_user_cached(id)).tag;
	} catch (error) {
		if (!(error instanceof Error))
			throw error;

		return "<unknown>";
	}
}
