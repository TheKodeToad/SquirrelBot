import { dateToUnixSecs } from "#common/time.ts";
import { duration } from "#plugins/core/public//customOptionTypes.ts";
import { permissionsGuard } from "#plugins/core/public/commandGuards.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import { remindersConfigStore } from "#plugins/reminders/plugin.ts";
import { trackNewReminder } from "#plugins/reminders/scheduler.ts";
import { remindersTable } from "#plugins/reminders/storage/reminders.ts";
import { MessageFlags } from "oceanic.js";

export default defineCommand({
	description: "Set a personal reminder after the specified amount of time.",
	name: ["remindme", "reminderset", "remind", "reminder"],

	options: {
		delay: {
			type: duration,
			name: ["delay", "d"],
			required: true,
			position: 0,
		},
		message: {
			type: "string",
			name: ["message", "m"],
			required: true,
			position: 1,
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			remindersConfigStore,
			(perms) => perms.personalReminders,
		),
	async run(ctx, args) {
		if (ctx.guild === null) {
			return;
		}

		const now = Date.now();
		const firesAt = now + args.delay;

		const reminders = {
			guildID: ctx.guild.id,
			ownerID: ctx.user.id,
			channelID: ctx.channel.id,
			channelType: ctx.channel.type,
			createdAt: new Date(now),
			firesAt: new Date(firesAt),
			message: args.message ?? undefined,
			silent:
				((ctx.message?.flags ?? 0)
					& MessageFlags.SUPPRESS_NOTIFICATIONS)
				!== 0,
		};
		const number = await remindersTable.insert(
			ctx.backendCtx.db,
			reminders,
		);

		trackNewReminder({
			number,
			...reminders,
		});

		const firesAtSecs = dateToUnixSecs(firesAt);

		await ctx.respond(
			`${icons.success} Reminder set for **<t:${firesAtSecs}>** (<t:${firesAtSecs}:R>) (reminder #${number})!\n`
				+ `${icons.tip} No notification will be sent if you are timed out or not present in the server.`,
		);
	},
});
