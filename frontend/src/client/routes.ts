import { buildURI } from "../common/uri";

export const AUTH_LOG_IN = "/api/v1/auth/log-in";
export const AUTH_LOG_OUT = "/api/v1/auth/log-out";
export const GUILDS = "/api/v1/guilds";
export const GUILD_CONFIG = (guildID: string, key: string) => buildURI`/api/v1/guilds/${guildID}/config/${key}`;
