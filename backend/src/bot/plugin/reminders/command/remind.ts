import { MessageFlags } from "oceanic.js";
import { dateToUnixSeconds } from "../../../../common/time.ts";
import { createReminder } from "../../../../db/reminders/reminders.ts";
import { defineCommand, OptionType } from "../../core/public/command.ts";
import { permissionsGuard } from "../../core/public/helper/commandGuards.ts";
import { icons } from "../../core/public/icons.ts";
import { remindersConfig } from "../index.ts";
import { trackNewReminder } from "../scheduler.ts";

export const remindCommand = defineCommand({
	name: ["remind", "reminderset", "remindme", "reminder"],
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

	preRun: (context) => permissionsGuard(context, remindersConfig, permissions => permissions.personal_reminders),
	async run(context, args) {
		if (context.guild === null)
			return;

		const now = Date.now();
		const firesAt = now + args.delay;

		const reminder = await createReminder(context.guild.id, {
			ownerID: context.user.id,
			channelID: context.channel.id,
			channelType: context.channel.type,
			createdAt: new Date(now),
			firesAt: new Date(firesAt),
			message: args.message ?? undefined,
			silent: ((context.message?.flags ?? 0) & MessageFlags.SUPPRESS_NOTIFICATIONS) !== 0,
		});

		trackNewReminder(reminder);

		const firesAtSecs = dateToUnixSeconds(firesAt);

		await context.respond(
			`${icons.success} Reminder set for <t:${firesAtSecs}> (<t:${firesAtSecs}:R>) [#${reminder.number}]!\n`
			+ `${icons.tip} No notification will be sent if you are muted or not present in the server.`
		);
	}
});
