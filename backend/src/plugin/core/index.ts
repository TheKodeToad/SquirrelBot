import { moduleLogger } from "#common/logger/index.ts";
import { aboutCommand } from "#plugin/core/command/about.ts";
import { grantAccessCommand, revokeAccessCommand } from "#plugin/core/command/access.ts";
import { groupsCommand } from "#plugin/core/command/groups.ts";
import { helpCommand } from "#plugin/core/command/help/index.ts";
import { initCommandCache } from "#plugin/core/commandEngine/commandCache.ts";
import { componentInterationHandler } from "#plugin/core/commandEngine/handler/componentHandler.ts";
import { prefixDeleteHandler, prefixEditHandler, prefixSendHandler } from "#plugin/core/commandEngine/handler/prefixHandler.ts";
import { slashRunHandler, syncSlashCommands } from "#plugin/core/commandEngine/handler/slashHandler.ts";
import { initConfigs } from "#plugin/core/configSync.ts";
import { installWrappedListener } from "#plugin/core/eventWrapper.ts";
import { guildInfoSyncGuildCreateHandler, guildInfoSyncGuildUpdateHandler, initGuildInfo } from "#plugin/core/guildInfoSync.ts";
import { initIcons } from "#plugin/core/iconSync.ts";
import { ConfigStore } from "#plugin/core/public/config.ts";
import { definePlugin } from "#plugin/index.ts";
import { getPlugins } from "#plugin/registry.ts";
import { CoreConfig } from "#schema/plugin/core.ts";

const logger = moduleLogger();

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

export const coreConfig = new ConfigStore(CoreConfig);

export default definePlugin({
	id: "core",
	name: "Core",
	description: "Core app functionality.",

	config: { store: coreConfig, defaultValue: defaultConfig },
	commands: [helpCommand, aboutCommand, grantAccessCommand, revokeAccessCommand, groupsCommand],
	listeners: [
		prefixSendHandler,
		prefixEditHandler,
		prefixDeleteHandler,
		slashRunHandler,
		componentInterationHandler,
		guildInfoSyncGuildCreateHandler,
		guildInfoSyncGuildUpdateHandler,
	],

	async apply() {
		initCommandCache();

		logger.debug?.("Initializing guild info");
		await initGuildInfo();
		logger.debug?.("Initializing configs");
		await initConfigs();
		logger.debug?.("Syncing slash commands");
		await syncSlashCommands();
		logger.debug?.("Initializing icons");
		await initIcons();

		// TODO: is it a good idea to add listeners before the plugin is applied (no)
		for (const plugin of getPlugins())
			if (plugin.listeners !== undefined)
				for (const listener of plugin.listeners)
					installWrappedListener(listener.type, listener.listener.bind(plugin));
	},
});
