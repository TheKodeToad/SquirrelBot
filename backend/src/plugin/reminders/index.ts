import type { Reminder } from "#db/reminders/reminders.ts";
import { debugFormatGuildByID } from "#discord/common/debugFormat.ts";
import { ConfigStore } from "#plugin/core/public/config.ts";
import { definePlugin } from "#plugin/index.ts";
import { remindCommand } from "#plugin/reminders/command/remind.ts";
import { reminderListCommand } from "#plugin/reminders/command/reminderList.ts";
import { beginPollingReminders } from "#plugin/reminders/scheduler.ts";
import { RemindersConfig } from "#schema/plugin/reminder.ts";

const defaultConfig = `enabled = false

[default_permissions]
# Uncomment to give access to everyone:
# personal_reminders = true

# Example: Allow users in the moderator group to delete reminders of other users
# [[permission_overrides]]
# in_group = ["moderator"]
`;

export const remindersConfig = new ConfigStore(RemindersConfig);

export default definePlugin({
	id: "reminders",
	name: "Reminders",
	description: "Set reminders for yourself.",

	config: { store: remindersConfig, defaultValue: defaultConfig },
	commands: [remindCommand, reminderListCommand],

	async apply() {
		await beginPollingReminders();
	},
});

export function debugFormatReminder(reminder: Reminder): string {
	return `#${reminder.number} in ${debugFormatGuildByID(reminder.guildID)}`;
}
