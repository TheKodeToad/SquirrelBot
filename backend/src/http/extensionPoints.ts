import type { GuildAuthVars } from "#http/middleware/guildAuth.ts";
import { makeArrayExtensionPoint, makeMultiMapExtensionPoint } from "#loader/extensionPoint.ts";
import type { Plugin } from "#loader/plugin.ts";
import type { Hono } from "hono";

/** Added to plugins/[YOUR PLUGIN]  */
export const definePluginRoutes = makeArrayExtensionPoint<(plugin: Plugin, app: Hono) => void>();
/** Added to guilds/[*]/plugins/[YOUR PLUGIN] */
export const definePluginGuildRoutes = makeMultiMapExtensionPoint<(app: Hono<{ Variables: GuildAuthVars; }>) => void>();
/** Added to guilds/[*]/plugins/[*] */
export const defineGlobalPluginGuildRoutes = makeArrayExtensionPoint<(plugin: Plugin, app: Hono<{ Variables: GuildAuthVars; }>) => void>();
