import { definePlugin } from "#plugin.ts";
import { ConfigStore } from "#plugin/core/public/configStore.ts";
import { defineConfig } from "#plugin/core/public/extensionPoints.ts";
import { LoggingConfig } from "#plugin/logging/config/index.ts";
import memberLogger from "#plugin/logging/logger/members.ts";
import messageLogger from "#plugin/logging/logger/messages.ts";
import modEventLogger from "#plugin/logging/logger/modEvents.ts";
import roleLogger from "#plugin/logging/logger/roles.ts";

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
	],
});
