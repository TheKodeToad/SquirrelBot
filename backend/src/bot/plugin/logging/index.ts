import { loggingConfigSchema } from "../../../schema/plugin/logging.ts";
import { definePlugin } from "../../loader/plugin.ts";
import { ConfigCache } from "../core/public/config.ts";
import { beginMessageCleanupLoop, messageLoggerCreateListener, messageLoggerDeleteListener, messageLoggerUpdateListener } from "./logger/messageLogger.ts";

export const loggingConfig = new ConfigCache(loggingConfigSchema);

export const logging = definePlugin({
	id: "logging",
	name: "Logging",
	description: "Log server events.",

	config: loggingConfig,
	listeners: [messageLoggerCreateListener, messageLoggerUpdateListener, messageLoggerDeleteListener],

	async apply() {
		await beginMessageCleanupLoop();
	},
});
