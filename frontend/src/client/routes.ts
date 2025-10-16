import { buildURI } from "../common/uris";

export const AUTH_LOG_IN = "/api/v1/auth/log-in";
export const AUTH_LOG_OUT = "/api/v1/auth/log-out";
export const GUILDS = "/api/v1/guilds";
export const PLUGIN_CONFIG = (guildID: string, plugin: string) => buildURI`/api/v1/guilds/${guildID}/plugins/${plugin}/config`;
