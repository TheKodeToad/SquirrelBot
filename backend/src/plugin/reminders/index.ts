import { debugFormatGuildByID } from "#common/discord/debugFormat.ts";
import { definePlugin } from "#plugin.ts";
import { ConfigStore } from "#plugin/core/public/configStore.ts";
import { defineConfig } from "#plugin/core/public/extensionPoints.ts";
import remind from "#plugin/reminders/command/remind.ts";
import reminderCancel from "#plugin/reminders/command/reminderCancel.ts";
import reminderList from "#plugin/reminders/command/reminderList.ts";
import { RemindersConfig } from "#plugin/reminders/config.ts";
import scheduler from "#plugin/reminders/scheduler.ts";
import type { Reminder } from "#plugin/reminders/storage/reminders.ts";
import type { Client } from "oceanic.js";

const defaultConfig = `enabled = false

[default_permissions]
# Uncomment to give access to everyone:
# personal_reminders = true

# Example: Allow users in the moderator group to delete reminders of other users
# [[permission_overrides]]
# in_group = ["moderator"]
`;

export const remindersConfigStore = new ConfigStore(RemindersConfig);

export default definePlugin({
	id: "reminders",
	name: "Reminders",
	description: "Set reminders for yourself.",

	contributions: [
		defineConfig({
			store: remindersConfigStore,
			defaultValue: defaultConfig,
		}),
		...scheduler,

		remind, reminderList, reminderCancel,
	],
});

export function debugFormatReminder(bot: Client, reminder: Reminder): string {
	return `#${reminder.number} in ${debugFormatGuildByID(bot, reminder.guildID)}`;
}
