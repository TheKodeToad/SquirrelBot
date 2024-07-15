import "dotenv/config";
import process from "process";

export const CLIENT_ID = process.env["CLIENT_ID"] || "";
export const CLIENT_SECRET = process.env["CLIENT_SECRET"] || "";
export const REDIRECT_URI = process.env["REDIRECT_URI"] || "";
export const BOT_TOKEN = process.env["BOT_DISCORD_TOKEN"] || "";
export const BOT_ALLOWED_GUILDS = new Set(process.env["BOT_ALLOWED_GUILDS"]?.split(",") ?? []);
export const BOT_ICON_GUILD = process.env["BOT_ICON_GUILD"] || "";
export const HTTP_PORT = Number(process.env["PORT"]) || 8080;
