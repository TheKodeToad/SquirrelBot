import { moduleLogger } from "#common/logger/index.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { EventListenerPhase } from "#extensionPoint.ts";
import { definePlugin } from "#plugin.ts";
import about from "#plugin/core/command/about.ts";
import access from "#plugin/core/command/access.ts";
import groups from "#plugin/core/command/groups.ts";
import help from "#plugin/core/command/help/index.ts";
import commandCache from "#plugin/core/commandEngine/commandCache.ts";
import componentHandler from "#plugin/core/commandEngine/handler/componentHandler.ts";
import prefixHandler from "#plugin/core/commandEngine/handler/prefixHandler.ts";
import slashHandler from "#plugin/core/commandEngine/handler/slashHandler.ts";
import { CoreConfig } from "#plugin/core/config.ts";
import configSync from "#plugin/core/configSync.ts";
import { installWrappedListener } from "#plugin/core/eventWrapper.ts";
import guildInfoSync from "#plugin/core/guildInfoSync.ts";
import configRoutes from "#plugin/core/http/configRoutes.ts";
import iconSync from "#plugin/core/iconSync.ts";
import { ConfigStore } from "#plugin/core/public/configStore.ts";
import { defineConfig, onBotEvent } from "#plugin/core/public/extensionPoints.ts";

const logger = moduleLogger();

export const coreConfigStore = new ConfigStore(CoreConfig);

const defaultConfig = `prefix_commands.prefix = "?" # Customize the prefix

# Example: Basic groups
# [groups.admin]
# roles = ["roleid"]
# inherits = ["moderator"]
#
# [groups.moderator]
# roles = ["roleid"]

[default_permissions]
# Uncomment to disable:
# prefix_commands = false
# slash_commands = false`;

export default definePlugin({
	id: "core",
	name: "Core",
	description: "Core app functionality.",

	contributions: [
		defineConfig({
			defaultValue: defaultConfig,
			store: coreConfigStore,
		}),

		...guildInfoSync,
		...configSync,
		...iconSync,

		...commandCache,
		...prefixHandler,
		...slashHandler,
		...componentHandler,

		onBotInit(postInit, EventListenerPhase.Post),

		help, about, ...access, groups,

		configRoutes,
	],
});

function postInit(ctx: SquirrelDiscordContext): void {
	logger.debug?.("Installing onBotEvent listeners");

	for (const listener of onBotEvent.contributions)
		installWrappedListener(ctx, listener.type, listener.listener.bind(listener));
}
