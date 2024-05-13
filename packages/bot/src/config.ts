import dotenv from "dotenv";
import process from "process";

dotenv.config({ path: "../../.env" });

export const DISCORD_TOKEN = process.env["DISCORD_TOKEN"] || "";
export const ALLOWED_GUILDS = new Set(process.env["ALLOWED_GUILDS"]?.split(",") ?? []);
