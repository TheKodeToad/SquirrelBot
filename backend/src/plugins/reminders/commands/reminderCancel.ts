import { permissionsGuard } from "#plugins/core/public/commandGuards.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import { remindersConfigStore } from "#plugins/reminders/plugin.ts";
import { untrackReminder } from "#plugins/reminders/scheduler.ts";
import { deleteReminderIfOwnedBy } from "#plugins/reminders/storage/reminders.ts";

export default defineCommand({
	name: ["remindercancel", "cancelreminder"],
	description: "Cancel a reminder using its number.",

	options: {
		number: {
			name: ["number", "n"],
			type: "integer",
			required: true,
			position: 0,
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			remindersConfigStore,
			(perms) => perms.personalReminders,
		),
	async run(ctx, { number }) {
		const deleted = await deleteReminderIfOwnedBy(
			ctx.backendCtx.db,
			ctx.guild.id,
			number,
			ctx.user.id,
		);

		if (deleted) {
			untrackReminder(ctx.guild.id, number);
			await ctx.respond(
				`${icons.success} Canceled reminder **#${number}**!`,
			);
		} else {
			await ctx.respond(
				`${icons.error} Reminder **#${number}** was not found!`,
			);
		}
	},
});
