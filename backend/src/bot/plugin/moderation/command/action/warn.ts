import { CaseType } from "../../../../../db/moderation/cases.ts";
import { formatUser } from "../../../../common/discord/format.ts";
import { escapeMarkdown } from "../../../../common/discord/markdown.ts";
import { defineCommand, OptionType } from "../../../core/public/command.ts";
import { permissionsGuard } from "../../../core/public/helper/commandGuards.ts";
import { icons } from "../../../core/public/icons.ts";
import { doBulkAction } from "../../helper/bulkAction.ts";
import { moderationConfig } from "../../index.ts";

export const warnCommand = defineCommand({
	name: ["warn"],
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
			negativeName: ["no-dm", "nd", "no-direct-message"],
		},
	},

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.warn),
	async run(context, args, { config }): Promise<void> {
		const sendDirectMessage = args.dm ?? config.ban.send_direct_message;
		const directMessage = sendDirectMessage
			? config.warn.direct_message ?? {
				content: `You received a warning in ${escapeMarkdown(context.guild.name)}: >>> ${args.reason ?? "*No reason provided*"}`
			}
			: undefined;

		const { successful, unsuccessful } = await doBulkAction({
			guild: context.guild,
			ids: args.user,

			actor: context.member,
			directMessage,

			membersOnly: false,

			perform() { },
			makeCase(actor, target, dmDelivered) {
				return {
					type: CaseType.Warn,
					actorID: actor,
					targetID: target,
					reason: args.reason ?? undefined,
					dmDelivered,
				};
			},
		});

		if (args.user.length === 1) {
			if (successful.length === 1) {
				const ban = successful[0]!;
				await context.respond(`${icons.success} Warned ${formatUser(ban.user)} ${ban.dmDelivered ? "with direct message " : ""}[#${ban.caseNumber}]!`);
			} else if (unsuccessful.length === 1) {
				const ban = unsuccessful[0]!;
				await context.respond(`${icons.error} Could not warn ${formatUser(ban.user)}: ${escapeMarkdown(ban.error)}!`);
			}
		} else {
			const successfulMessage = successful.map(ban => `- ${formatUser(ban.user)} ${ban.dmDelivered ? "with direct message " : ""}[#${ban.caseNumber}]`).join("\n");
			const unsuccessfulMessage = unsuccessful.map(ban => `- ${formatUser(ban.user)}: ${escapeMarkdown(ban.error)}`).join("\n");

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