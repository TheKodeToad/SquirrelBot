import { DiscordRESTError } from "oceanic.js";

export function format_rest_error(rest_error: DiscordRESTError) {
	if (rest_error.resBody !== null
		&& typeof rest_error.resBody.message === "string") {
		return `API Error ${rest_error.code}: ${rest_error.resBody.message}`;
	}

	return `HTTP Error ${rest_error.status}: ${rest_error.statusText}`;
}