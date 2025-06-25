import { debugFormatGuildByID } from "#common/discord/debugFormat.ts";
import { definePlugin } from "#loader/plugin.ts";
import { ConfigStore } from "#plugin/core/public/discord/configStore.ts";
import { defineConfig } from "#plugin/core/public/extensionPoints.ts";
import { RemindersConfig } from "#plugin/reminders/config.ts";
import remind from "#plugin/reminders/discord/command/remind.ts";
import reminderList from "#plugin/reminders/discord/command/reminderList.ts";
import scheduler from "#plugin/reminders/discord/scheduler.ts";
import type { Reminder } from "#plugin/reminders/storage/reminders.ts";

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

		remind, reminderList,
	],
});

export function debugFormatReminder(reminder: Reminder): string {
	return `#${reminder.number} in ${debugFormatGuildByID(reminder.guildID)}`;
}
