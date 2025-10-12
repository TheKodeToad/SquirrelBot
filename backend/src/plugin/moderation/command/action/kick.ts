import { makeGuildView } from "#common/template/guild.ts";
import { makeUserView } from "#common/template/user.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { formatModActionFailure, formatModActionSuccess } from "#plugin/moderation/helper/format.ts";
import { performModActions } from "#plugin/moderation/helper/modAction.ts";
import { moderationConfigStore } from "#plugin/moderation/index.ts";
import { ModActionType } from "#plugin/moderation/public/modAction.ts";
import type { CreateMessageOptions } from "oceanic.js";

export default defineCommand({
	name: ["kick"],
	description: "Remove a member from the server.",

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
			position: 1,
		},
		dm: {
			type: OptionType.Flag,
			name: ["dm", "d", "direct-message"],
			description: "Choose whether to notify the kicked user with a DM (overrides the configured default).",
			negativeName: ["no-dm", "nd", "no-direct-message"],
		},
	},

	preRun: context => permissionsGuard(context, moderationConfigStore, permissions => permissions.kick),
	async run(context, args, { config }) {
		const sendDirectMessage = args.dm ?? config.ban.send_direct_message;
		const directMessage: CreateMessageOptions | undefined =
			sendDirectMessage ?
				config.kick.direct_message.render({
					server: makeGuildView(context.guild),
					moderator: makeUserView(context.user),
					reason: args.reason ?? undefined,
				})
				: undefined;

		const { successful, unsuccessful } = await performModActions(context.guild, args.user, target => ({
			guild: context.guild,

			type: ModActionType.Kick,

			actor: context.member,
			target,
			ranking: config.member_ranking,

			reason: args.reason ?? undefined,

			directMessage,
		}));

		if (args.user.length === 1) {
			if (successful.length === 1)
				await context.respond(`${icons.success} Kicked ${formatModActionSuccess(successful[0]!)}!`);
			else if (unsuccessful.length === 1)
				await context.respond(`${icons.error} Could not kick ${formatModActionFailure(unsuccessful[0]!)}!`);
		} else {
			const successfulMessage = successful.map(item => `- ${formatModActionSuccess(item)}`).join("\n");
			const unsuccessfulMessage = unsuccessful.map(item => `- ${formatModActionFailure(item)}`).join("\n");

			if (unsuccessful.length === 0) {
				await context.respond(
					`${icons.success} Kicked all **${args.user.length} users**:\n${successfulMessage}`
				);
			} else if (successful.length === 0) {
				await context.respond(
					`${icons.error} None of **${args.user.length} users** were kicked:\n${unsuccessfulMessage}`
				);
			} else {
				await context.respond(
					`${icons.warning} Only **${successful.length} of ${args.user.length} users** were kicked!\n`
					+ `Successful kicks:\n${successfulMessage}\n`
					+ `Unsuccessful kicks:\n${unsuccessfulMessage}`
				);
			}
		}
	},
});
