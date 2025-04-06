import "dotenv/config";
import process from "process";
import { LogLevel, parse_level as parse_log_level } from "./common/logger/level.ts";

export const CLIENT_ID = process.env["CLIENT_ID"] || "";
export const CLIENT_SECRET = process.env["CLIENT_SECRET"] || "";
export const REDIRECT_URI = process.env["REDIRECT_URI"] || "";
export const BOT_TOKEN = process.env["BOT_DISCORD_TOKEN"] || "";
export const BOT_ALLOWED_GUILDS = process.env["BOT_ALLOWED_GUILDS"]?.split(",") ?? [];
export const HTTP_PORT = Number(process.env["PORT"]) || 8080;
export const DB_TYPE_INTEGRITY = parse_boolean(process.env["DB_TYPE_INTEGRITY"]) ?? true;
export const LOG_LEVEL = parse_log_level(process.env["LOG_LEVEL"] || "INFO") ?? LogLevel.INFO;

function parse_boolean(string: string | undefined): boolean | undefined {
	if (string === undefined)
		return undefined;

	if (string === "0" || string === "false")
		return false;

	if (string === "1" || string === "true")
		return true;

	return undefined;
}
