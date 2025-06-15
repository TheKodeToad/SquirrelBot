import { moduleLogger } from "#common/logger/index.ts";
import { onBotPostInit, onBotPreInit } from "#discord/extensionPoints.ts";
import { definePlugin } from "#loader/plugin.ts";
import about from "#plugin/core/command/about.ts";
import access from "#plugin/core/command/access.ts";
import groups from "#plugin/core/command/groups.ts";
import help from "#plugin/core/command/help/index.ts";
import { initCommandCache } from "#plugin/core/commandEngine/commandCache.ts";
import componentHandler from "#plugin/core/commandEngine/handler/componentHandler.ts";
import prefixHandler from "#plugin/core/commandEngine/handler/prefixHandler.ts";
import slashHandler, { syncSlashCommands } from "#plugin/core/commandEngine/handler/slashHandler.ts";
import { CoreConfig } from "#plugin/core/config.ts";
import { initConfigs } from "#plugin/core/configSync.ts";
import { installWrappedListener } from "#plugin/core/eventWrapper.ts";
import guildInfoSync, { initGuildInfo } from "#plugin/core/guildInfoSync.ts";
import { initIcons } from "#plugin/core/iconSync.ts";
import { ConfigStore } from "#plugin/core/public/configStore.ts";
import { defineConfig, onBotEvent } from "#plugin/core/public/extensionPoints.ts";

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

export const coreConfigStore = new ConfigStore(CoreConfig);

const logger = moduleLogger();

export default definePlugin({
	id: "core",
	name: "Core",
	description: "Core app functionality.",

	contributions: [
		defineConfig({
			defaultValue: defaultConfig,
			store: coreConfigStore,
		}),
		onBotPreInit(preInit),
		onBotPostInit(postInit),

		help, about, ...access, groups,

		...prefixHandler,
		...slashHandler,
		...componentHandler,
		...guildInfoSync,
	],
});

async function preInit(): Promise<void> {
	initCommandCache();

	logger.debug?.("Initializing guild info");
	await initGuildInfo();
	logger.debug?.("Initializing configs");
	await initConfigs();
	logger.debug?.("Syncing slash commands");
	await syncSlashCommands();
	logger.debug?.("Initializing icons");
	await initIcons();
}

function postInit(): void {
	for (const listener of onBotEvent.contributedValues)
		installWrappedListener(listener.type, listener.listener.bind(listener));
}
