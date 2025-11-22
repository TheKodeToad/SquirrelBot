import { makeArrayExtensionPoint, makeMultiMapExtensionPoint } from "#extensionPoint.ts";
import type { SquirrelHTTPContext } from "#http/index.ts";
import type { GuildAuthVars } from "#http/middleware/guildAuth.ts";
import type { Plugin } from "#plugin.ts";
import type { Hono } from "hono";

/** Added to plugins/[YOUR PLUGIN]  */
export const definePluginRoutes = makeArrayExtensionPoint<(squirrelCtx: SquirrelHTTPContext, plugin: Plugin, app: Hono) => void>();
/** Added to guilds/[*]/plugins/[YOUR PLUGIN] */
export const definePluginGuildRoutes = makeMultiMapExtensionPoint<(squirrelCtx: SquirrelHTTPContext, app: Hono<{ Variables: GuildAuthVars; }>) => void>();
/** Added to guilds/[*]/plugins/[*] */
export const defineGlobalPluginGuildRoutes = makeArrayExtensionPoint<(squirrelCtx: SquirrelHTTPContext, plugin: Plugin, app: Hono<{ Variables: GuildAuthVars; }>) => void>();
