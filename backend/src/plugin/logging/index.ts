import { definePlugin } from "#loader/plugin.ts";
import { ConfigStore } from "#plugin/core/discord/public/configStore.ts";
import { defineConfig } from "#plugin/core/public/extensionPoints.ts";
import { LoggingConfig } from "#plugin/logging/config.ts";
import messageLogger from "#plugin/logging/discord/logger/messageLogger.ts";

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
	],
});
