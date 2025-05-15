import { definePlugin } from "#bot/loader/plugin.ts";
import { ConfigStore } from "#bot/plugin/core/public/config.ts";
import { beginMessageCleanupLoop, messageLoggerCreateListener, messageLoggerDeleteListener, messageLoggerUpdateListener } from "#bot/plugin/logging/logger/messageLogger.ts";
import { loggingConfigSchema } from "#schema/plugin/logging.ts";

export const loggingConfig = new ConfigStore(loggingConfigSchema);

const defaultConfig = `enabled = false

# Example: message log
# [[loggers]]
# channel = "channelid"
# events.message_edit = true
`;

export const logging = definePlugin({
	id: "logging",
	name: "Logging",
	description: "Log server events.",

	config: { store: loggingConfig, defaultValue: defaultConfig },
	listeners: [messageLoggerCreateListener, messageLoggerUpdateListener, messageLoggerDeleteListener],

	async apply() {
		await beginMessageCleanupLoop();
	},
});
