import { moduleLogger } from "#common/logger/index.ts";
import { onBotInit } from "#interface/discord/extensionPoints.ts";
import { EventListenerPhase } from "#loader/extensionPoint.ts";
import { definePlugin } from "#loader/plugin.ts";
import { CoreConfig } from "#plugin/core/config.ts";
import about from "#plugin/core/discord/command/about.ts";
import access from "#plugin/core/discord/command/access.ts";
import groups from "#plugin/core/discord/command/groups.ts";
import help from "#plugin/core/discord/command/help/index.ts";
import commandCache from "#plugin/core/discord/commandEngine/commandCache.ts";
import componentHandler from "#plugin/core/discord/commandEngine/handler/componentHandler.ts";
import prefixHandler from "#plugin/core/discord/commandEngine/handler/prefixHandler.ts";
import slashHandler from "#plugin/core/discord/commandEngine/handler/slashHandler.ts";
import configSync from "#plugin/core/discord/configSync.ts";
import { installWrappedListener } from "#plugin/core/discord/eventWrapper.ts";
import guildInfoSync from "#plugin/core/discord/guildInfoSync.ts";
import iconSync from "#plugin/core/discord/iconSync.ts";
import { ConfigStore } from "#plugin/core/discord/public/configStore.ts";
import { onBotEvent } from "#plugin/core/discord/public/extensionPoints.ts";
import configRoutes from "#plugin/core/http/configRoutes.ts";
import { defineConfig } from "./public/extensionPoints.ts";

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

function postInit(): void {
	logger.debug?.("Installing onBotEvent listeners");

	for (const listener of onBotEvent.contributions)
		installWrappedListener(listener.type, listener.listener.bind(listener));
}
