import { definePlugin } from "#plugin.ts";
import { ConfigStore } from "#plugins/core/public/configStore.ts";
import { defineConfig } from "#plugins/core/public/extensionPoints.ts";
import { LoggingConfig } from "#plugins/logging/config/index.ts";
import memberLogger from "#plugins/logging/logger/members.ts";
import messageLogger from "#plugins/logging/logger/messages.ts";
import modEventLogger from "#plugins/logging/logger/modEvents.ts";
import roleLogger from "#plugins/logging/logger/roles.ts";
import tagsLogger from "#plugins/logging/logger/tags.ts";

export const loggingConfigStore = new ConfigStore(LoggingConfig);

const defaultConfig = `enabled = false

# Example: message log
# [[loggers]]
# channel = "channelid"
# events.message_edit = true
`;

export default definePlugin({
	id: "logging",
	name: "Logging",
	description: "Log server events.",

	contributions: [
		defineConfig({
			store: loggingConfigStore,
			defaultValue: defaultConfig,
		}),
		...messageLogger,
		...roleLogger,
		...memberLogger,
		...modEventLogger,
		...tagsLogger,
	],
});
