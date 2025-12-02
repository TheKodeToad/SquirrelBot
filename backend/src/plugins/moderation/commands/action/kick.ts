import { makeGuildView } from "#common/views/guild.ts";
import { makeUserView } from "#common/views/user.ts";
import { permissionsGuard } from "#plugins/core/public/commandGuards.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import {
	formatModActionFailure,
	formatModActionSuccess,
} from "#plugins/moderation/format.ts";
import { performModActions } from "#plugins/moderation/modAction.ts";
import { moderationConfigStore } from "#plugins/moderation/plugin.ts";
import { ModEventType } from "#plugins/moderation/public/modEvent.ts";
import type { CreateMessageOptions } from "oceanic.js";

export default defineCommand({
	name: ["kick"],
	description: "Remove a member from the server.",

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
			name: ["dm", "d", "direct-message"],
			description:
				"Choose whether to notify the kicked user with a DM (overrides the configured default).",
			negativeName: ["no-dm", "nd", "no-direct-message"],
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			moderationConfigStore,
			(permissions) => permissions.kick,
		),
	async run(ctx, args, { config }) {
		const sendDirectMessage = args.dm ?? config.ban.sendDirectMessage;
		const directMessage: CreateMessageOptions | undefined =
			sendDirectMessage ?
				config.kick.directMessage.render({
					server: makeGuildView(ctx.guild),
					moderator: makeUserView(ctx.user),
					reason: args.reason ?? undefined,
				})
			:	undefined;

		const { successful, unsuccessful } = await performModActions(
			ctx.backendCtx,
			ctx.guild,
			args.user,
			(target) => ({
				guild: ctx.guild,

				type: ModEventType.Kick,

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
					`${icons.success} Kicked ${formatModActionSuccess(successful[0]!)}!`,
				);
			} else if (unsuccessful.length === 1) {
				await ctx.respond(
					`${icons.error} Could not kick ${formatModActionFailure(unsuccessful[0]!)}!`,
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
					`${icons.success} Kicked all **${args.user.length} users**:\n${successfulMessage}`,
				);
			} else if (successful.length === 0) {
				await ctx.respond(
					`${icons.error} None of **${args.user.length} users** were kicked:\n${unsuccessfulMessage}`,
				);
			} else {
				await ctx.respond(
					`${icons.warning} Only **${successful.length} of ${args.user.length} users** were kicked!\n` +
						`Successful kicks:\n${successfulMessage}\n` +
						`Unsuccessful kicks:\n${unsuccessfulMessage}`,
				);
			}
		}
	},
});
