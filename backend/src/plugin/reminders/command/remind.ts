import { dateToUnixSecs } from "#common/time.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { remindersConfigStore } from "#plugin/reminders/index.ts";
import { trackNewReminder } from "#plugin/reminders/scheduler.ts";
import {
	createReminder,
	type CreateReminderOptions,
} from "#plugin/reminders/storage/reminders.ts";
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
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			remindersConfigStore,
			(permissions) => permissions.personal_reminders,
		),
	async run(ctx, args) {
		if (ctx.guild === null) {
			return;
		}

		const now = Date.now();
		const firesAt = now + args.delay;

		const options: CreateReminderOptions = {
			ownerID: ctx.user.id,
			channelID: ctx.channel.id,
			channelType: ctx.channel.type,
			createdAt: new Date(now),
			firesAt: new Date(firesAt),
			message: args.message ?? undefined,
			silent:
				((ctx.message?.flags ?? 0) & MessageFlags.SUPPRESS_NOTIFICATIONS) !== 0,
		};
		const number = await createReminder(
			ctx.squirrelCtx.db,
			ctx.guild.id,
			options,
		);

		trackNewReminder({
			guildID: ctx.guild.id,
			number,
			...options,
		});

		const firesAtSecs = dateToUnixSecs(firesAt);

		await ctx.respond(
			`${icons.success} Reminder set for **<t:${firesAtSecs}>** (<t:${firesAtSecs}:R>) (reminder #${number})!\n` +
				`${icons.tip} No notification will be sent if you are timed out or not present in the server.`,
		);
	},
});
