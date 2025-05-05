import { CaseType } from "../../../../../db/moderation/cases.ts";
import { escapeMarkdown } from "../../../../common/discord/markdown.ts";
import { defineCommand, OptionType } from "../../../core/public/command.ts";
import { permissionsGuard } from "../../../core/public/helper/commandGuards.ts";
import { icons } from "../../../core/public/icons.ts";
import { doBulkAction } from "../../helper/bulkAction.ts";
import { formatBulkError, formatBulkSuccess } from "../../helper/format.ts";
import { moderationConfig } from "../../index.ts";

export const warnCommand = defineCommand({
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

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.warn),
	async run(context, args, { config }): Promise<void> {
		const sendDirectMessage = args.dm ?? config.ban.send_direct_message;
		const directMessage = sendDirectMessage
			? config.warn.direct_message ?? {
				content: `You received a warning in **${escapeMarkdown(context.guild.name)}**: >>> ${args.reason ?? "*No reason provided*"}`
			}
			: undefined;

		const { successful, unsuccessful } = await doBulkAction({
			guild: context.guild,
			ids: args.user,

			actor: context.member,
			directMessage,

			membersOnly: false,

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
					`${icons.success} Warned all ${args.user.length} users:\n${successfulMessage}`
				);
			} else if (successful.length === 0) {
				await context.respond(
					`${icons.error} None of ${args.user.length} users were warned:\n${unsuccessfulMessage}`
				);
			} else {
				await context.respond(
					`${icons.warning} Only ${successful.length} of ${args.user.length} warns were successful!\n`
					+ `Successful warns:\n${successfulMessage}\n`
					+ `Unsuccessful warns:\n${unsuccessfulMessage}`
				);
			}
		}
	}
});
