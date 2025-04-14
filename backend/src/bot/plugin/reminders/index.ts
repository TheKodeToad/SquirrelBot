import { remindersConfigSchema } from "../../../schema/plugin/reminder.ts";
import { definePlugin } from "../../loader/plugin.ts";
import { ConfigCache } from "../core/public/config.ts";
import { remindCommand } from "./command/remindCommand.ts";
import { beginPollingReminders } from "./scheduler.ts";

export const remindersConfig = new ConfigCache(remindersConfigSchema);

export const remindersPlugin = definePlugin({
	id: "reminders",
	config: remindersConfig,
	commands: [remindCommand],

	apply() {
		beginPollingReminders();
	},
});