import { AUTH_LOG_IN, AUTH_LOG_OUT, GUILDS } from "./routes";

type HttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

export interface LogInResponse {
	token: string;
	expires_at: number;
	username: string;
	avatar: string;
}

export interface ErrorResponse {
	error: string;
}

export interface GuildResponse {
	id: string;
	name: string;
	icon_hash: string;
	owner_id: string;
}

async function request_json<T>(route: string, method: HttpMethod, token?: string, body?: any): Promise<T | ErrorResponse> {
	const headers = new Headers;
	headers.set("Content-Type", "application/json");

	if (token !== undefined)
		headers.set("Authorization", token);

	const response = await fetch(route, {
		method: method,
		body: body !== undefined ? JSON.stringify(body) : undefined,
		headers,
	});

	const text = await response.text();

	if (text.length === 0)
		return null as T;

	return JSON.parse(text);
}

export function log_in(code: string) {
	return request_json<LogInResponse>(AUTH_LOG_IN, "POST", undefined, { code });
}

export function log_out(token: string) {
	return request_json<null>(AUTH_LOG_OUT, "GET", token);
}

export function get_guilds(token: string) {
	return request_json<GuildResponse[]>(GUILDS, "GET", token);
}
