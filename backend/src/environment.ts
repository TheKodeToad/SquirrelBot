import { LogLevel, logLevelByName } from "#common/logger/level.ts";
import process from "process";

export const CLIENT_ID = process.env["CLIENT_ID"] || "";
export const CLIENT_SECRET = process.env["CLIENT_SECRET"] || "";
export const REDIRECT_URI = process.env["REDIRECT_URI"] || "";
export const BOT_TOKEN = process.env["BOT_DISCORD_TOKEN"] || "";
export const BOT_ALLOWED_GUILDS =
	process.env["BOT_ALLOWED_GUILDS"]?.split(",") ?? [];
export const BOT_STAFF = process.env["BOT_STAFF"]?.split("?") ?? [];
export const HTTP_PORT = Number(process.env["PORT"]) || 8080;
export const LOG_LEVEL =
	logLevelByName(process.env["LOG_LEVEL"] || "info") ?? LogLevel.Info;

// advanced

/**
 * Enables precautions against type confusion vulnerabilities or confusing bugs by doing extra runtime type checking on internal structures.
 * This is applied to database return types and parsed commands.
 *
 * This is on by default.
 *
 * You do not get much by disabling this - some redundant and potentially more expensive checks are simply skipped.
 * User facing validation is not skipped nor are many trivial checks.
 */
export const INTERNAL_TYPE_INTEGRITY =
	parseBoolean(process.env["INTERNAL_TYPE_INTEGRITY"]) ?? true;

export const CACHE_PATH = process.env["CACHE_PATH"] ?? "./cache";

function parseBoolean(string: string | undefined): boolean | undefined {
	if (string === undefined) {
		return undefined;
	}

	if (string === "0" || string === "false") {
		return false;
	}

	if (string === "1" || string === "true") {
		return true;
	}

	return undefined;
}
