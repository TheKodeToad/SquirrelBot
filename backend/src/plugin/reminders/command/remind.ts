import { dateToUnixSecs } from "#common/time.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { remindersConfigStore } from "#plugin/reminders/index.ts";
import { trackNewReminder } from "#plugin/reminders/scheduler.ts";
import { createReminder } from "#plugin/reminders/storage/reminders.ts";
import { MessageFlags } from "oceanic.js";

export default defineCommand({
	description: "Set a personal reminder after the specified amount of time.",
	name: ["remindme", "reminderset", "remind", "reminder"],

	options: {
		delay: {
			type: OptionType.Duration,
			name: ["delay", "d"],
			required: true,
			position: 0,
		},
		message: {
			type: OptionType.String,
			name: ["message", "m"],
			required: true,
			position: 1,
		}
	},

	preRun: (context) => permissionsGuard(context, remindersConfigStore, permissions => permissions.personal_reminders),
	async run(context, args) {
		if (context.guild === null)
			return;

		const now = Date.now();
		const firesAt = now + args.delay;

		const reminder = await createReminder(context.discordCtx.db, context.guild.id, {
			ownerID: context.user.id,
			channelID: context.channel.id,
			channelType: context.channel.type,
			createdAt: new Date(now),
			firesAt: new Date(firesAt),
			message: args.message ?? undefined,
			silent: ((context.message?.flags ?? 0) & MessageFlags.SUPPRESS_NOTIFICATIONS) !== 0,
		});

		trackNewReminder(reminder);

		const firesAtSecs = dateToUnixSecs(firesAt);

		await context.respond(
			`${icons.success} Reminder set for **<t:${firesAtSecs}>** (<t:${firesAtSecs}:R>) (reminder #${reminder.number})!\n`
			+ `${icons.tip} No notification will be sent if you are timed out or not present in the server.`
		);
	}
});
