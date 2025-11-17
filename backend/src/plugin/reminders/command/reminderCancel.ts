import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { remindersConfigStore } from "#plugin/reminders/index.ts";
import { untrackReminder } from "#plugin/reminders/scheduler.ts";
import { deleteReminderIfOwnedBy } from "#plugin/reminders/storage/reminders.ts";

export default defineCommand({
	name: ["remindercancel", "cancelreminder"],
	description: "Cancel a reminder using its number.",

	options: {
		number: {
			name: ["number", "n"],
			type: OptionType.Integer,
			required: true,
			position: 0,
		}
	},


	preRun: context => permissionsGuard(context, remindersConfigStore, permissions => permissions.personal_reminders),
	async run(context, { number }) {
		const deleted = await deleteReminderIfOwnedBy(context.guild.id, number, context.user.id);

		if (deleted) {
			untrackReminder(context.guild.id, number);
			await context.respond(`${icons.success} Canceled reminder **#${number}**!`);
		} else
			await context.respond(`${icons.error} Reminder **#${number}** was not found!`);
	}
});
