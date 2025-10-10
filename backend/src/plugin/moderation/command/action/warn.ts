import { makeGuildView } from "#common/template/guild.ts";
import { makeUserView } from "#common/template/user.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { doBulkAction } from "#plugin/moderation/helper/bulkAction.ts";
import { formatBulkError, formatBulkSuccess } from "#plugin/moderation/helper/format.ts";
import { moderationConfigStore } from "#plugin/moderation/index.ts";
import { CaseType } from "#plugin/moderation/storage/cases.ts";

export default defineCommand({
	name: ["warn"],
	description: "Record a warning for a user.",

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
			description: "Choose whether to notify the warned user with a DM (overrides the configured default).",
			name: ["dm", "d", "direct-message"],
			negativeName: ["no-dm", "nd", "no-direct-message"],
		},
	},

	preRun: context => permissionsGuard(context, moderationConfigStore, permissions => permissions.warn),
	async run(context, args, { config }): Promise<void> {
		const sendDirectMessage = args.dm ?? config.ban.send_direct_message;
		const directMessage = sendDirectMessage
			? config.warn.direct_message.render({
				server: makeGuildView(context.guild),
				moderator: makeUserView(context.user),
				reason: args.reason ?? undefined,
			})
			: undefined;

		const { successful, unsuccessful } = await doBulkAction({
			guild: context.guild,
			ids: args.user,

			actor: context.member,
			directMessage,
			memberRanking: config.member_ranking,
			membersOnly: false,
			botNeedsPerm: false,

			perform() { },
			makeCase(options) {
				return {
					...options,
					type: CaseType.Warn,
					reason: args.reason ?? undefined,
				};
			},
		});


		if (args.user.length === 1) {
			if (successful.length === 1)
				await context.respond(`${icons.success} Warned ${formatBulkSuccess(successful[0]!)}!`);
			else if (unsuccessful.length === 1)
				await context.respond(`${icons.error} Could not warn ${formatBulkError(unsuccessful[0]!)}!`);
		} else {
			const successfulMessage = successful.map(item => `- ${formatBulkSuccess(item)}`).join("\n");
			const unsuccessfulMessage = unsuccessful.map(item => `- ${formatBulkError(item)}`).join("\n");

			if (unsuccessful.length === 0) {
				await context.respond(
					`${icons.success} Warned all **${args.user.length} users**:\n${successfulMessage}`
				);
			} else if (successful.length === 0) {
				await context.respond(
					`${icons.error} None of **${args.user.length} users** were warned:\n${unsuccessfulMessage}`
				);
			} else {
				await context.respond(
					`${icons.warning} Only **${successful.length} of ${args.user.length} users** warned!\n`
					+ `Successful warns:\n${successfulMessage}\n`
					+ `Unsuccessful warns:\n${unsuccessfulMessage}`
				);
			}
		}
	}
});
