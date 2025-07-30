import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { doBulkAction } from "#plugin/moderation/helper/bulkAction.ts";
import { formatBulkError, formatBulkSuccess } from "#plugin/moderation/helper/format.ts";
import { moderationConfigStore } from "#plugin/moderation/index.ts";
import { CaseType } from "#plugin/moderation/storage/cases.ts";

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
			? config.ban.direct_message.apply({
				server: context.guild,
				moderator: context.user,
				reason: args.reason ?? undefined,
			})
			: undefined;

		const deleteMessageSeconds = (args.purge ?? config.ban.purge_messages);

		const { successful, unsuccessful } = await doBulkAction({
			guild: context.guild,
			ids: args.user,

			actor: context.member,
			directMessage,
			memberRanking: config.member_ranking,

			membersOnly: false,

			async perform(user) {
				await context.guild.createBan(user.id, {
					reason: args.reason ?? undefined,
					deleteMessageSeconds: deleteMessageSeconds,
				});
			},
			makeCase(options) {
				return {
					...options,
					type: CaseType.Ban,
					reason: args.reason ?? undefined,
					deleteMessageSeconds,
				};
			},
		});

		if (args.user.length === 1) {
			if (successful.length === 1)
				await context.respond(`${icons.success} Banned ${formatBulkSuccess(successful[0]!)}!`);
			else if (unsuccessful.length === 1)
				await context.respond(`${icons.error} Could not ban ${formatBulkError(unsuccessful[0]!)}!`);
		} else {
			const successfulMessage = successful.map(item => `- ${formatBulkSuccess(item)}`).join("\n");
			const unsuccessfulMessage = unsuccessful.map(item => `- ${formatBulkError(item)}`).join("\n");

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
