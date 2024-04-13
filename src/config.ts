import "dotenv/config";

import process from "process";

export const DISCORD_TOKEN = process.env["DISCORD_TOKEN"] || "";
export const ALLOWED_GUILDS = new Set(process.env["ALLOWED_GUILDS"]?.split(",") ?? []);
