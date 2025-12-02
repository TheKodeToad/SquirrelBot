import { moduleLogger } from "#common/logger/index.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { EventListenerPhase } from "#extensionPoint.ts";
import { definePlugin } from "#plugin.ts";
import about from "#plugins/core/command/about.ts";
import access from "#plugins/core/command/access.ts";
import groups from "#plugins/core/command/groups.ts";
import help from "#plugins/core/command/help/index.ts";
import commandCache from "#plugins/core/commandEngine/commandCache.ts";
import autoCompleteHandler from "#plugins/core/commandEngine/handler/autocompleteHandler.ts";
import componentHandler from "#plugins/core/commandEngine/handler/componentHandler.ts";
import prefixHandler from "#plugins/core/commandEngine/handler/prefixHandler.ts";
import slashHandler from "#plugins/core/commandEngine/handler/slashHandler.ts";
import { CoreConfig } from "#plugins/core/config.ts";
import configSync from "#plugins/core/configSync.ts";
import { installWrappedListener } from "#plugins/core/eventWrapper.ts";
import guildInfoSync from "#plugins/core/guildInfoSync.ts";
import configRoutes from "#plugins/core/http/configRoutes.ts";
import iconSync from "#plugins/core/iconSync.ts";
import { ConfigStore } from "#plugins/core/public/configStore.ts";
import {
	defineConfig,
	onBotEvent,
} from "#plugins/core/public/extensionPoints.ts";

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
		...autoCompleteHandler,
		...componentHandler,

		onBotInit(postInit, EventListenerPhase.Post),

		help,
		about,
		...access,
		groups,

		configRoutes,
	],
});

function postInit(ctx: SquirrelDiscordContext): void {
	logger.debug?.("Installing onBotEvent listeners");

	for (const listener of onBotEvent.contributions) {
		installWrappedListener(
			ctx,
			listener.type,
			listener.listener.bind(listener),
		);
	}
}
