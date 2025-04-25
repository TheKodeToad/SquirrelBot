import type { Reminder } from "../../../db/reminders/reminders.ts";
import { remindersConfigSchema } from "../../../schema/plugin/reminder.ts";
import { debugFormatGuildByID } from "../../common/discord/debugFormat.ts";
import { definePlugin } from "../../loader/plugin.ts";
import { ConfigCache } from "../core/public/config.ts";
import { remindCommand } from "./command/remind.ts";
import { reminderListCommand } from "./command/reminderList.ts";
import { beginPollingReminders } from "./scheduler.ts";

export const remindersConfig = new ConfigCache(remindersConfigSchema);

export const remindersPlugin = definePlugin({
	id: "reminders",
	name: "Reminders",
	description: "Set reminders for yourself.",

	config: remindersConfig,
	commands: [remindCommand, reminderListCommand],

	apply() {
		beginPollingReminders();
	},
});

export function debugFormatReminder(reminder: Reminder) {
	return `#${reminder.number} in ${debugFormatGuildByID(reminder.guildID)}`;
}
