import { ConfigStore } from "#plugin/core/public/config.ts";
import { definePlugin } from "#plugin/index.ts";
import { beginMessageCleanupLoop, messageLoggerCreateListener, messageLoggerDeleteListener, messageLoggerUpdateListener } from "#plugin/logging/logger/messageLogger.ts";
import { LogginConfig } from "#schema/plugin/logging.ts";

export const loggingConfig = new ConfigStore(LogginConfig);

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

	config: { store: loggingConfig, defaultValue: defaultConfig },
	listeners: [messageLoggerCreateListener, messageLoggerUpdateListener, messageLoggerDeleteListener],

	async apply() {
		await beginMessageCleanupLoop();
	},
});
