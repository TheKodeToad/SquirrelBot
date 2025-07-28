import type { GuildAuthVars } from "#http/middleware/guildAuth.ts";
import { makeArrayExtensionPoint, makeMultiMapExtensionPoint } from "#loader/extensionPoint.ts";
import type { Plugin } from "#loader/plugin.ts";
import type { Hono } from "hono";

export const defineGlobalPluginRoutes = makeArrayExtensionPoint<(plugin: Plugin, app: Hono) => void>();

export const definePluginGuildRoutes = makeMultiMapExtensionPoint<(app: Hono<{ Variables: GuildAuthVars; }>) => void>();
export const defineGlobalPluginGuildRoutes = makeArrayExtensionPoint<(plugin: Plugin, app: Hono<{ Variables: GuildAuthVars; }>) => void>();
