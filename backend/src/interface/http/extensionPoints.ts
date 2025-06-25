import type { GuildAuthVars } from "#interface/http/middleware/guildAuth.ts";
import { makeArrayExtensionPoint, makeMultiMapExtensionPoint } from "#loader/extensionPoint.ts";
import type { Plugin } from "#loader/plugin.ts";
import type { Hono } from "hono";

export const definePluginRoutes = makeMultiMapExtensionPoint<(app: Hono<{ Variables: GuildAuthVars; }>) => void>();
export const defineGlobalPluginRoutes = makeArrayExtensionPoint<(plugin: Plugin, app: Hono<{ Variables: GuildAuthVars; }>) => void>();
