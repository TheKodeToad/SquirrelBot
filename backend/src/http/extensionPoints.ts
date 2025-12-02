import {
	makeArrayExtensionPoint,
	makeMultiMapExtensionPoint,
} from "#extensionPoint.ts";
import type { BackendHTTPContext } from "#http/http.ts";
import type { GuildAuthVars } from "#http/middleware/guildAuth.ts";
import type { Plugin } from "#plugin.ts";
import type { Hono } from "hono";

/** Added to plugins/[YOUR PLUGIN]  */
export const definePluginRoutes =
	makeArrayExtensionPoint<
		(backendCtx: BackendHTTPContext, plugin: Plugin, app: Hono) => void
	>();
/** Added to guilds/[*]/plugins/[YOUR PLUGIN] */
export const definePluginGuildRoutes =
	makeMultiMapExtensionPoint<
		(
			backendCtx: BackendHTTPContext,
			app: Hono<{ Variables: GuildAuthVars }>,
		) => void
	>();
/** Added to guilds/[*]/plugins/[*] */
export const defineGlobalPluginGuildRoutes =
	makeArrayExtensionPoint<
		(
			backendCtx: BackendHTTPContext,
			plugin: Plugin,
			app: Hono<{ Variables: GuildAuthVars }>,
		) => void
	>();
