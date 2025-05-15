import type { Reminder } from "#db/reminders/reminders.ts";
import { remindersConfigSchema } from "#schema/plugin/reminder.ts";
import { debugFormatGuildByID } from "#bot/common/discord/debugFormat.ts";
import { definePlugin } from "#bot/loader/plugin.ts";
import { ConfigStore } from "#bot/plugin/core/public/config.ts";
import { remindCommand } from "#bot/plugin/reminders/command/remind.ts";
import { reminderListCommand } from "#bot/plugin/reminders/command/reminderList.ts";
import { beginPollingReminders } from "#bot/plugin/reminders/scheduler.ts";

const defaultConfig = `enabled = false

[default_permissions]
# Uncomment to give access to everyone:
# personal_reminders = true

# Example: Allow users in the moderator group to delete reminders of other users
# [[permission_overrides]]
# in_group = ["moderator"]
`;

export const remindersConfig = new ConfigStore(remindersConfigSchema);

export const remindersPlugin = definePlugin({
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
