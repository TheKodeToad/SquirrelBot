import type { CreateMessageOptions } from "oceanic.js";
import { CaseType } from "../../../../../db/moderation/cases.ts";
import { formatUser } from "../../../../common/discord/format.ts";
import { escapeMarkdown } from "../../../../common/discord/markdown.ts";
import { OptionType, defineCommand } from "../../../core/public/command.ts";
import { permissionsGuard } from "../../../core/public/helper/commandGuards.ts";
import { icons } from "../../../core/public/icons.ts";
import { doBulkAction } from "../../helper/bulkAction.ts";
import { moderationConfig } from "../../index.ts";

export const kickCommand = defineCommand({
	name: ["kick"],
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

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.kick),
	async run(context, args, { config }) {
		const sendDirectMessage = args.dm ?? config.ban.send_direct_message;
		const directMessage: CreateMessageOptions | undefined =
			sendDirectMessage ?
				config.ban.direct_message ?? {
					content: `You were kicked from ${escapeMarkdown(context.guild.name)}.`
				} :
				undefined;

		const { successful, unsuccessful } = await doBulkAction({
			guild: context.guild,
			ids: args.user,

			actor: context.member,
			directMessage: directMessage,

			membersOnly: true,

			perform: async member => await context.guild.removeMember(member.id, args.reason ?? undefined),
			makeCase(actor, target, dmDelivered) {
				return {
					type: CaseType.Kick,
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
				await context.respond(`${icons.success} Kicked ${formatUser(ban.user)} ${ban.dmDelivered ? "with direct message " : ""}[#${ban.caseNumber}]!`);
			} else if (unsuccessful.length === 1) {
				const ban = unsuccessful[0]!;
				await context.respond(`${icons.error} Could not kick ${formatUser(ban.user)}: ${escapeMarkdown(ban.error)}!`);
			}
		} else {
			const successfulMessage = successful.map(ban => `- ${formatUser(ban.user)} ${ban.dmDelivered ? "with direct message " : ""}[#${ban.caseNumber}]`).join("\n");
			const unsuccessfulMessage = unsuccessful.map(ban => `- ${formatUser(ban.user)}: ${escapeMarkdown(ban.error)}`).join("\n");

			if (unsuccessful.length === 0) {
				await context.respond(
					`${icons.success} Kicked all ${args.user.length} users:\n${successfulMessage}`
				);
			} else if (successful.length === 0) {
				await context.respond(
					`${icons.error} None of ${args.user.length} users were kicked:\n${unsuccessfulMessage}`
				);
			} else {
				await context.respond(
					`${icons.warning} Only ${successful.length} of ${args.user.length} kicks were successful!\n`
					+ `Successful kicks:\n${successfulMessage}\n`
					+ `Unsuccessful kicks:\n${unsuccessfulMessage}`
				);
			}
		}
	},
});
