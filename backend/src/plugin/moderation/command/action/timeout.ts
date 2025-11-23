import { makeDurationView } from "#common/template/duration.ts";
import { makeGuildView } from "#common/template/guild.ts";
import { makeUserView } from "#common/template/user.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import {
	formatModActionFailure,
	formatModActionSuccess,
} from "#plugin/moderation/helper/format.ts";
import { performModActions } from "#plugin/moderation/helper/modAction.ts";
import { moderationConfigStore } from "#plugin/moderation/index.ts";
import { ModEventType } from "#plugin/moderation/public/modEvent.ts";

export default defineCommand({
	name: ["timeout", "mute"],
	description: "Time out a member (only allow them to read messages).",

	options: {
		user: {
			type: OptionType.User,
			name: ["user", "u"],
			array: true,
			required: true,
			position: 0,
		},
		duration: {
			type: OptionType.Duration,
			name: ["duration", "d", "for"],
			required: true,
			position: 1,
		},
		reason: {
			type: OptionType.String,
			name: ["reason", "r"],
			required: false,
			position: 2,
		},
		dm: {
			type: OptionType.Flag,
			description:
				"Choose whether to notify the timed out user with a DM (overrides the configured default).",
			name: ["dm", "d", "direct-message"],
			negativeName: ["no-dm", "nd", "no-direct-message"],
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			moderationConfigStore,
			(permissions) => permissions.timeout,
		),
	async run(ctx, args, { config }) {
		const sendDirectMessage = args.dm ?? config.timeout.send_direct_message;
		const directMessage = sendDirectMessage
			? config.timeout.direct_message.render({
					server: makeGuildView(ctx.guild),
					moderator: makeUserView(ctx.user),
					reason: args.reason ?? undefined,
					duration: makeDurationView(args.duration),
				})
			: undefined;

		const { successful, unsuccessful } = await performModActions(
			ctx.squirrelCtx,
			ctx.guild,
			args.user,
			(target) => ({
				guild: ctx.guild,

				type: ModEventType.Timeout,
				expiresAt: new Date(Date.now() + args.duration),

				actor: ctx.member,
				target,
				ranking: config.member_ranking,

				reason: args.reason ?? undefined,

				directMessage,
			}),
		);

		if (args.user.length === 1) {
			if (successful.length === 1) {
				await ctx.respond(
					`${icons.success} Timed out ${formatModActionSuccess(successful[0]!)}!`,
				);
			} else if (unsuccessful.length === 1) {
				await ctx.respond(
					`${icons.error} Could not time out ${formatModActionFailure(unsuccessful[0]!)}!`,
				);
			}
		} else {
			const successfulMessage = successful
				.map((item) => `- ${formatModActionSuccess(item)}`)
				.join("\n");
			const unsuccessfulMessage = unsuccessful
				.map((item) => `- ${formatModActionFailure(item)}`)
				.join("\n");

			if (unsuccessful.length === 0) {
				await ctx.respond(
					`${icons.success} Timed out all **${args.user.length} users**:\n${successfulMessage}`,
				);
			} else if (successful.length === 0) {
				await ctx.respond(
					`${icons.error} None of **${args.user.length} users** were timed out:\n${unsuccessfulMessage}`,
				);
			} else {
				await ctx.respond(
					`${icons.warning} Only **${successful.length} of ${args.user.length} users** were timed out!\n` +
						`Successful timeouts:\n${successfulMessage}\n` +
						`Unsuccessful timeouts:\n${unsuccessfulMessage}`,
				);
			}
		}
	},
});
