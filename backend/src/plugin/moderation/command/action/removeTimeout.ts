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
	name: [
		"removetimeout",
		"timeoutremove",
		"rmtimeout",
		"untimeout",
		"removemute",
		"muteremove",
		"rmmute",
		"unmute",
	],
	description: "Remove a member's timeout.",

	options: {
		user: {
			type: OptionType.User,
			name: ["user", "u"],
			array: true,
			required: true,
			position: 0,
		},
		reason: {
			type: OptionType.String,
			name: ["reason", "r"],
			required: false,
			position: 1,
		},
		dm: {
			type: OptionType.Flag,
			description:
				"Choose whether to notify the affected user with a DM (overrides the configured default).",
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
		const sendDirectMessage =
			args.dm ?? config.removeTimeout.sendDirectMessage;
		const directMessage = sendDirectMessage
			? config.removeTimeout.directMessage.render({
					server: makeGuildView(ctx.guild),
					moderator: makeUserView(ctx.user),
					reason: args.reason ?? undefined,
				})
			: undefined;

		const { successful, unsuccessful } = await performModActions(
			ctx.squirrelCtx,
			ctx.guild,
			args.user,
			(target) => ({
				guild: ctx.guild,

				type: ModEventType.ClearTimeout,

				actor: ctx.member,
				target,
				ranking: config.memberRanking,

				reason: args.reason ?? undefined,

				directMessage,
			}),
		);

		if (args.user.length === 1) {
			if (successful.length === 1) {
				await ctx.respond(
					`${icons.success} Removed timeout from ${formatModActionSuccess(successful[0]!)}!`,
				);
			} else if (unsuccessful.length === 1) {
				await ctx.respond(
					`${icons.error} Could not remove timeout from ${formatModActionFailure(unsuccessful[0]!)}!`,
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
					`${icons.success} Removed timeout for all **${args.user.length} users**:\n${successfulMessage}`,
				);
			} else if (successful.length === 0) {
				await ctx.respond(
					`${icons.error} None of **${args.user.length} users** had their timeouts removed:\n${unsuccessfulMessage}`,
				);
			} else {
				await ctx.respond(
					`${icons.warning} Only **${successful.length} of ${args.user.length} users** had their timeouts removed!\n` +
						`Successful removals:\n${successfulMessage}\n` +
						`Unsuccessful removals:\n${unsuccessfulMessage}`,
				);
			}
		}
	},
});
