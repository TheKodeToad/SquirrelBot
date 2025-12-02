import { makeGuildView } from "#common/views/guild.ts";
import { makeUserView } from "#common/views/user.ts";
import { permissionsGuard } from "#plugins/core/public/commandGuards.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import {
	formatModActionFailure,
	formatModActionSuccess,
} from "#plugins/moderation/helper/format.ts";
import { performModActions } from "#plugins/moderation/helper/modAction.ts";
import { moderationConfigStore } from "#plugins/moderation/index.ts";
import { ModEventType } from "#plugins/moderation/public/modEvent.ts";

export default defineCommand({
	name: ["warn"],
	description: "Record a warning for a user.",

	options: {
		user: {
			type: "user",
			name: ["user", "u"],
			array: true,
			required: true,
			position: 0,
		},
		reason: {
			type: "string",
			name: ["reason", "r"],
			position: 1,
		},
		dm: {
			type: "boolean",
			description:
				"Choose whether to notify the warned user with a DM (overrides the configured default).",
			name: ["dm", "d", "direct-message"],
			negativeName: ["no-dm", "nd", "no-direct-message"],
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			moderationConfigStore,
			(permissions) => permissions.warn,
		),
	async run(ctx, args, { config }): Promise<void> {
		const sendDirectMessage = args.dm ?? config.ban.sendDirectMessage;
		const directMessage =
			sendDirectMessage ?
				config.warn.directMessage.render({
					server: makeGuildView(ctx.guild),
					moderator: makeUserView(ctx.user),
					reason: args.reason ?? undefined,
				})
			:	undefined;

		const { successful, unsuccessful } = await performModActions(
			ctx.squirrelCtx,
			ctx.guild,
			args.user,
			(target) => ({
				guild: ctx.guild,

				type: ModEventType.Warn,

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
					`${icons.success} Warned ${formatModActionSuccess(successful[0]!)}!`,
				);
			} else if (unsuccessful.length === 1) {
				await ctx.respond(
					`${icons.error} Could not warn ${formatModActionFailure(unsuccessful[0]!)}!`,
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
					`${icons.success} Warned all **${args.user.length} users**:\n${successfulMessage}`,
				);
			} else if (successful.length === 0) {
				await ctx.respond(
					`${icons.error} None of **${args.user.length} users** were warned:\n${unsuccessfulMessage}`,
				);
			} else {
				await ctx.respond(
					`${icons.warning} Only **${successful.length} of ${args.user.length} users** warned!\n` +
						`Successful warns:\n${successfulMessage}\n` +
						`Unsuccessful warns:\n${unsuccessfulMessage}`,
				);
			}
		}
	},
});
