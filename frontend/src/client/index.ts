import { AUTH_LOG_IN, AUTH_LOG_OUT, GUILD_CONFIG, GUILDS } from "./routes";

type HTTPMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

function extractMessage(body: unknown) {
	if (typeof body === "string")
		return body;

	if (typeof body === "object" && body !== null && "error" in body)
		return body.error;

	return "No message";
}

export class RESTError extends Error {
	body: unknown;

	constructor(status: number, body: unknown) {
		super(`${status} - ${extractMessage(body)}`);
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

async function request<T>(route: string, method: HTTPMethod, token?: string, body?: any): Promise<T> {
	const headers = new Headers;

	if (body != null)
		headers.set("Content-Type", "application/json");

	if (token !== undefined)
		headers.set("Authorization", token);

	const response = await fetch(route, {
		method: method,
		body: body !== undefined ? JSON.stringify(body) : undefined,
		headers,
	});

	if (response.status === 204)
		return null as T;

	const isJson = response.headers.get("Content-Type") === "application/json";
	const responseBody = isJson ? await response.json() : await response.text();

	if (!response.ok)
		throw new RESTError(response.status, responseBody);

	return responseBody;
}

export function logIn(code: string) {
	return request<LogInResponse>(AUTH_LOG_IN, "POST", undefined, { code });
}

export function logOut(token: string) {
	return request<null>(AUTH_LOG_OUT, "GET", token);
}

export function getGuilds(token: string) {
	return request<GuildResponse[]>(GUILDS, "GET", token);
}

export async function getGuildConfig(token: string, guildID: string, config: string) {
	return request<string>(GUILD_CONFIG(guildID, config), "GET", token);
}
