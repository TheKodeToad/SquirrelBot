import { makeGuildView } from "#common/template/guild.ts";
import { makeUserView } from "#common/template/user.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { formatModActionFailure, formatModActionSuccess } from "#plugin/moderation/helper/format.ts";
import { performModAction, performModActions } from "#plugin/moderation/helper/modAction.ts";
import { moderationConfigStore } from "#plugin/moderation/index.ts";
import { ModEventType } from "#plugin/moderation/public/modEvent.ts";

export default defineCommand({
	name: ["ban"],
	description: "Ban a user from the server.",

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
			description: "Choose whether to notify the banned user with a DM (overrides the configured default).",
			name: ["dm", "d", "direct-message"],
			negativeName: ["no-dm", "nd", "no-direct-message"],
		},
		purge: {
			type: OptionType.Duration,
			description: "Request to delete messages within the specified duration of being sent.",
			name: ["purge", "p", "delete"],
		},
	},

	preRun: context => permissionsGuard(context, moderationConfigStore, permissions => permissions.ban),
	async run(context, args, { config }) {
		const sendDirectMessage = args.dm ?? config.ban.send_direct_message;
		const directMessage = sendDirectMessage
			? config.ban.direct_message.render({
				server: makeGuildView(context.guild),
				moderator: makeUserView(context.user),
				reason: args.reason ?? undefined,
			})
			: undefined;

		const deleteMessageSeconds = args.purge !== null
				? args.purge / 1000
				: config.ban.purge_messages;

		const { successful, unsuccessful } = await performModActions(context.guild, args.user, target => ({
			guild: context.guild,

			type: ModEventType.Ban,

			actor: context.member,
			target: target,
			ranking: config.member_ranking,

			reason: args.reason ?? undefined,

			deleteMessageSeconds,
			directMessage,
		}));

		if (args.user.length === 1) {
			if (successful.length === 1)
				await context.respond(`${icons.success} Banned ${formatModActionSuccess(successful[0]!)}!`);
			else if (unsuccessful.length === 1)
				await context.respond(`${icons.error} Could not ban ${formatModActionFailure(unsuccessful[0]!)}!`);
		} else {
			const successfulMessage = successful.map(item => `- ${formatModActionSuccess(item)}`).join("\n");
			const unsuccessfulMessage = unsuccessful.map(item => `- ${formatModActionFailure(item)}`).join("\n");

			if (unsuccessful.length === 0) {
				await context.respond(
					`${icons.success} Banned all **${args.user.length} users**:\n${successfulMessage}`
				);
			} else if (successful.length === 0) {
				await context.respond(
					`${icons.error} None of **${args.user.length} users** were banned:\n${unsuccessfulMessage}`
				);
			} else {
				await context.respond(
					`${icons.warning} Only **${successful.length} of ${args.user.length} users** were banned!\n`
					+ `Successful:\n${successfulMessage}\n`
					+ `Unsuccessful:\n${unsuccessfulMessage}`
				);
			}
		}
	},
});
