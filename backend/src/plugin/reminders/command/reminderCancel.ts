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
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			remindersConfigStore,
			(permissions) => permissions.personal_reminders,
		),
	async run(ctx, { number }) {
		const deleted = await deleteReminderIfOwnedBy(
			ctx.squirrelCtx.db,
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
