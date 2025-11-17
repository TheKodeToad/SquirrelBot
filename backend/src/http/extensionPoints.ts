import type { HTTPContext } from "#http/index.ts";
import type { GuildAuthVars } from "#http/middleware/guildAuth.ts";
import { makeArrayExtensionPoint, makeMultiMapExtensionPoint } from "#loader/extensionPoint.ts";
import type { Plugin } from "#loader/plugin.ts";
import type { Hono } from "hono";

/** Added to plugins/[YOUR PLUGIN]  */
export const definePluginRoutes = makeArrayExtensionPoint<(httpCtx: HTTPContext, plugin: Plugin, app: Hono) => void>();
/** Added to guilds/[*]/plugins/[YOUR PLUGIN] */
export const definePluginGuildRoutes = makeMultiMapExtensionPoint<(httpCtx: HTTPContext, app: Hono<{ Variables: GuildAuthVars; }>) => void>();
/** Added to guilds/[*]/plugins/[*] */
export const defineGlobalPluginGuildRoutes = makeArrayExtensionPoint<(httpCtx: HTTPContext, plugin: Plugin, app: Hono<{ Variables: GuildAuthVars; }>) => void>();
