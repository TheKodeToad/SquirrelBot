import { makeGuildView } from "#common/views/guild.ts";
import { makeUserView } from "#common/views/user.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugins/core/public/helper/commandGuards.ts";
import { duration } from "#plugins/core/public/helper/customOptionTypes.ts";
import { icons } from "#plugins/core/public/icons.ts";
import {
	formatModActionFailure,
	formatModActionSuccess,
} from "#plugins/moderation/helper/format.ts";
import { performModActions } from "#plugins/moderation/helper/modAction.ts";
import { moderationConfigStore } from "#plugins/moderation/index.ts";
import { ModEventType } from "#plugins/moderation/public/modEvent.ts";

export default defineCommand({
	name: ["ban"],
	description: "Ban a user from the server.",

	options: {
		user: {
			type: "user",
			name: ["user", "u"],
			array: true,
			required: true,
			position: 0,
		},
		duration: {
			type: duration,
			name: ["duration", "d", "for"],
			position: 1,
			skipIfInvalid: true,
		},
		reason: {
			type: "string",
			name: ["reason", "r"],
			position: 2,
		},
		dm: {
			type: "boolean",
			description:
				"Choose whether to notify the banned user with a DM (overrides the configured default).",
			name: ["dm", "d", "direct-message"],
			negativeName: ["no-dm", "nd", "no-direct-message"],
		},
		purge: {
			type: duration,
			description:
				"Request to delete messages within the specified duration of being sent.",
			name: ["purge", "p", "delete"],
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			moderationConfigStore,
			(permissions) => permissions.ban,
		),
	async run(ctx, args, { config }) {
		const sendDirectMessage = args.dm ?? config.ban.sendDirectMessage;
		const directMessage =
			sendDirectMessage ?
				config.ban.directMessage.render({
					server: makeGuildView(ctx.guild),
					moderator: makeUserView(ctx.user),
					reason: args.reason ?? undefined,
				})
			:	undefined;

		const deleteMessageSeconds =
			args.purge !== null ? args.purge / 1000 : config.ban.purgeMessages;

		const { successful, unsuccessful } = await performModActions(
			ctx.squirrelCtx,
			ctx.guild,
			args.user,
			(target) => ({
				guild: ctx.guild,

				type: ModEventType.Ban,
				expiresAt:
					args.duration !== null ?
						new Date(Date.now() + args.duration)
					:	undefined,

				actor: ctx.member,
				target: target,
				ranking: config.memberRanking,

				reason: args.reason ?? undefined,

				deleteMessageSeconds,
				directMessage,
			}),
		);

		if (args.user.length === 1) {
			if (successful.length === 1) {
				await ctx.respond(
					`${icons.success} Banned ${formatModActionSuccess(successful[0]!)}!`,
				);
			} else if (unsuccessful.length === 1) {
				await ctx.respond(
					`${icons.error} Could not ban ${formatModActionFailure(unsuccessful[0]!)}!`,
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
					`${icons.success} Banned all **${args.user.length} users**:\n${successfulMessage}`,
				);
			} else if (successful.length === 0) {
				await ctx.respond(
					`${icons.error} None of **${args.user.length} users** were banned:\n${unsuccessfulMessage}`,
				);
			} else {
				await ctx.respond(
					`${icons.warning} Only **${successful.length} of ${args.user.length} users** were banned!\n` +
						`Successful:\n${successfulMessage}\n` +
						`Unsuccessful:\n${unsuccessfulMessage}`,
				);
			}
		}
	},
});
