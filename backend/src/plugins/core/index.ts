import { definePlugin } from "#plugin.ts";
import commandCache from "#plugins/core/commandEngine/commandCache.ts";
import autoCompleteHandler from "#plugins/core/commandEngine/handler/autocompleteHandler.ts";
import componentHandler from "#plugins/core/commandEngine/handler/componentHandler.ts";
import prefixHandler from "#plugins/core/commandEngine/handler/prefixHandler.ts";
import slashHandler from "#plugins/core/commandEngine/handler/slashHandler.ts";
import about from "#plugins/core/commands/about.ts";
import access from "#plugins/core/commands/access.ts";
import groups from "#plugins/core/commands/groups.ts";
import help from "#plugins/core/commands/help/index.ts";
import { CoreConfig } from "#plugins/core/config.ts";
import configSync from "#plugins/core/configSync.ts";
import eventDispatcher from "#plugins/core/eventDispatcher.ts";
import guildInfoSync from "#plugins/core/guildInfoSync.ts";
import configRoutes from "#plugins/core/http/configRoutes.ts";
import iconSync from "#plugins/core/iconSync.ts";
import { ConfigStore } from "#plugins/core/public/configStore.ts";
import { defineConfig } from "#plugins/core/public/extensionPoints.ts";

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

		...eventDispatcher,
		...commandCache,
		...prefixHandler,
		...slashHandler,
		...autoCompleteHandler,
		...componentHandler,

		help,
		about,
		...access,
		groups,

		configRoutes,
	],
});
