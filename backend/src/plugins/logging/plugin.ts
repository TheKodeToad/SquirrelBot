import { definePlugin } from "#plugin.ts";
import { ConfigStore } from "#plugins/core/public/configStore.ts";
import { defineConfig } from "#plugins/core/public/extensionPoints.ts";
import { LoggingConfig } from "#plugins/logging/config.ts";
import memberLogger from "#plugins/logging/loggers/members/handler.ts";
import messageLogger from "#plugins/logging/loggers/messages/handler.ts";
import modEventLogger from "#plugins/logging/loggers/modEvents/handler.ts";
import roleLogger from "#plugins/logging/loggers/roles/handler.ts";
import tagsLogger from "#plugins/logging/loggers/tags/handler.ts";

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
