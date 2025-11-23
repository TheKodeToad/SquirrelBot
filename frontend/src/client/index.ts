import { AUTH_LOG_IN, AUTH_LOG_OUT, GUILDS, PLUGIN_CONFIG } from "./routes";

type HTTPMethod =
	| "GET"
	| "HEAD"
	| "POST"
	| "PUT"
	| "DELETE"
	| "CONNECT"
	| "OPTIONS"
	| "TRACE"
	| "PATCH";

function extractMessage(body: unknown) {
	if (typeof body === "string") {
		return body;
	}

	if (typeof body === "object" && body !== null && "error" in body) {
		return body.error;
	}

	return "No message";
}

export class RESTError extends Error {
	body: unknown;

	constructor(status: number, route: string, body: unknown) {
		super(`${status} at ${route} - ${extractMessage(body)}`);
		this.name = "RESTError";
		this.body = body;
	}
}

export interface LogInResponse {
	token: string;
	expiresAt: number;
	username: string;
	avatar: string;
}

export interface ErrorResponse {
	error: string;
}

export interface GuildResponse {
	id: string;
	name: string;
	iconHash: string;
	ownerID: string;
}

export interface RequestOptions {
	token?: string;
	body?:
		| {
				contentType: "application/json";
				value: unknown;
		  }
		| {
				contentType: string;
				data: string;
		  };
}

async function request<T>(
	method: HTTPMethod,
	route: string,
	options: RequestOptions = {},
): Promise<T> {
	const headers = new Headers();

	let body: string | undefined;

	if (options.body !== undefined) {
		headers.set("Content-Type", options.body.contentType);
		if ("value" in options.body) {
			body = JSON.stringify(options.body.value);
		} else {
			body = options.body.data;
		}
	}

	if (options.token !== undefined) {
		headers.set("Authorization", options.token);
	}

	const response = await fetch(route, { method, body, headers });

	if (response.status === 204) {
		return null as T;
	}

	const isJson = response.headers.get("Content-Type") === "application/json";
	const responseBody = isJson ? await response.json() : await response.text();

	if (!response.ok) {
		throw new RESTError(response.status, route, responseBody);
	}

	return responseBody;
}

export function logIn(code: string, codeVerifier: string) {
	return request<LogInResponse>("POST", AUTH_LOG_IN, {
		body: {
			contentType: "application/json",
			value: { code, codeVerifier },
		},
	});
}

export async function logOut(token: string) {
	await request<null>("GET", AUTH_LOG_OUT, { token });
}

export function getGuilds(token: string) {
	return request<GuildResponse[]>("GET", GUILDS, { token });
}

export function getGuildConfig(token: string, guildID: string, plugin: string) {
	return request<string>("GET", PLUGIN_CONFIG(guildID, plugin), { token });
}

export async function writeGuildConfig(
	token: string,
	guildID: string,
	plugin: string,
	text: string,
) {
	await request<null>("PUT", PLUGIN_CONFIG(guildID, plugin), {
		token,
		body: {
			contentType: "application/toml",
			data: text,
		},
	});
}
