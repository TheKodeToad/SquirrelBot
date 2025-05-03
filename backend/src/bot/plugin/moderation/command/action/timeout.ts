import { CaseType } from "../../../../../db/moderation/cases.ts";
import { formatUser } from "../../../../common/discord/format.ts";
import { escapeMarkdown } from "../../../../common/discord/markdown.ts";
import { defineCommand, OptionType } from "../../../core/public/command.ts";
import { permissionsGuard } from "../../../core/public/helper/commandGuards.ts";
import { icons } from "../../../core/public/icons.ts";
import { doBulkAction } from "../../helper/bulkAction.ts";
import { moderationConfig } from "../../index.ts";

export const timeoutCommand = defineCommand({
	name: ["timeout", "mute", "chatmute"],
	description: "Prevent a member from chatting - or doing anything other than reading messages - in the server .",

	options: {
		user: {
			type: OptionType.User,
			name: ["user", "u"],
			array: true,
			required: true,
			position: 0,
		},
		duration: {
			type: OptionType.Duration,
			name: ["duration", "d", "for"],
			required: true,
			position: 1,
		},
		reason: {
			type: OptionType.String,
			name: ["reason", "r"],
			required: false,
			position: 2,
		},
		dm: {
			type: OptionType.Flag,
			description: "Choose whether to notify the kicked user with a direct message - overrides the configured default!",
			name: ["dm", "d", "direct-message"],
			negativeName: ["no-dm", "nd", "no-direct-message"],
		}
	},

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.mute),
	async run(context, args, { config }) {
		const sendDirectMessage = args.dm ?? config.mute.send_direct_message;
		const directMessage = sendDirectMessage
			? config.mute.direct_message ?? {
				content: `You are temporarily muted in ${escapeMarkdown(context.guild.name)}.`
			}
			: undefined;

		const expiresAt = new Date(Date.now() + args.duration);

		const { successful, unsuccessful } = await doBulkAction({
			guild: context.guild,
			ids: args.user,

			actor: context.member,
			directMessage,

			membersOnly: true,

			async perform(member) {
				await context.guild.editMember(member.id, {
					communicationDisabledUntil: expiresAt.toISOString(),
					reason: args.reason ?? undefined,
				});
			},
			makeCase(actor, target, dmDelivered) {
				return {
					type: CaseType.Mute,
					expiresAt,
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
				await context.respond(`${icons.success} Mute ${formatUser(ban.user)} ${ban.dmDelivered ? "with direct message " : ""}[#${ban.caseNumber}]!`);
			} else if (unsuccessful.length === 1) {
				const ban = unsuccessful[0]!;
				await context.respond(`${icons.error} Could not mute ${formatUser(ban.user)}: ${escapeMarkdown(ban.error)}!`);
			}
		} else {
			const successfulMessage = successful.map(ban => `- ${formatUser(ban.user)} ${ban.dmDelivered ? "with direct message " : ""}[#${ban.caseNumber}]`).join("\n");
			const unsuccessfulMessage = unsuccessful.map(ban => `- ${formatUser(ban.user)}: ${escapeMarkdown(ban.error)}`).join("\n");

			if (unsuccessful.length === 0) {
				await context.respond(
					`${icons.success} Muted all ${args.user.length} users:\n${successfulMessage}`
				);
			} else if (successful.length === 0) {
				await context.respond(
					`${icons.error} None of ${args.user.length} users were muted:\n${unsuccessfulMessage}`
				);
			} else {
				await context.respond(
					`${icons.warning} Only ${successful.length} of ${args.user.length} mutes were successful!\n`
					+ `Successful bans:\n${successfulMessage}\n`
					+ `Unsuccessful bans:\n${unsuccessfulMessage}`
				);
			}
		}
	},
});
