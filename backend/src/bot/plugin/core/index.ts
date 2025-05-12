import { moduleLogger } from "../../../common/logger/index.ts";
import { coreConfigSchema } from "../../../schema/plugin/core.ts";
import { getPlugins } from "../../loader/index.ts";
import { definePlugin } from "../../loader/plugin.ts";
import { aboutCommand } from "./command/about.ts";
import { grantAccessCommand, revokeAccessCommand } from "./command/access.ts";
import { groupsCommand } from "./command/groups.ts";
import { helpCommand } from "./command/help/index.ts";
import { initCommandCache } from "./commandEngine/commandCache.ts";
import { componentInterationHandler } from "./commandEngine/handler/componentHandler.ts";
import { prefixDeleteHandler, prefixEditHandler, prefixSendHandler } from "./commandEngine/handler/prefixHandler.ts";
import { slashRunHandler, syncSlashCommands } from "./commandEngine/handler/slashHandler.ts";
import { initConfigs } from "./configSync.ts";
import { installWrappedListener } from "./eventWrapper.ts";
import { guildInfoSyncGuildCreateHandler, guildInfoSyncGuildUpdateHandler, initGuildInfo } from "./guildInfoSync.ts";
import { initIcons } from "./iconSync.ts";
import { ConfigStore } from "./public/config.ts";

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

export const coreConfig = new ConfigStore(coreConfigSchema);

export const corePlugin = definePlugin({
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
