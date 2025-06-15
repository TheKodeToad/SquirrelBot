import { CaseType } from "#db/moderation/cases.ts";
import { escapeMarkdown } from "#discord/common/markdown.ts";
import { defineCommand, OptionType } from "#plugin/core/public/command.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { doBulkAction } from "#plugin/moderation/helper/bulkAction.ts";
import { formatBulkError, formatBulkSuccess } from "#plugin/moderation/helper/format.ts";
import { moderationConfig } from "#plugin/moderation/index.ts";
import { Permissions } from "oceanic.js";

export const timeoutCommand = defineCommand({
	name: ["timeout", "mute", "chatmute"],
	description: "Time out a member (only allow them to read messages).",

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
			description: "Choose whether to notify the timed out user with a DM (overrides the configured default).",
			name: ["dm", "d", "direct-message"],
			negativeName: ["no-dm", "nd", "no-direct-message"],
		}
	},

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.timeout),
	async run(context, args, { config }) {
		const sendDirectMessage = args.dm ?? config.timeout.send_direct_message;
		const directMessage = sendDirectMessage
			? config.timeout.direct_message?.({
				server: context.guild,
				moderator: context.user,
				reason: args.reason ?? undefined,
				duration: args.duration,
			}) ?? { content: `You were timed out for **${args.duration}** in **${escapeMarkdown(context.guild.name)}**` }
			: undefined;

		const { successful, unsuccessful } = await doBulkAction({
			guild: context.guild,
			ids: args.user,

			actor: context.member,
			directMessage,
			duration: args.duration,

			membersOnly: true,

			check: member => {
				if (member.permissions.has(Permissions.ADMINISTRATOR))
					return "Member has admin permissions - forbidden by Discord";

				return true;
			},
			async perform(member, calculatedExpiry) {
				await context.guild.editMember(member.id, {
					communicationDisabledUntil: calculatedExpiry!.toISOString(),
					reason: args.reason ?? undefined,
				});
			},
			makeCase(options) {
				return {
					...options,
					type: CaseType.Timeout,
					reason: args.reason ?? undefined,
				};
			},
		});

		if (args.user.length === 1) {
			if (successful.length === 1)
				await context.respond(`${icons.success} Timed out ${formatBulkSuccess(successful[0]!)}!`);
			else if (unsuccessful.length === 1)
				await context.respond(`${icons.error} Could not time out ${formatBulkError(unsuccessful[0]!)}!`);
		} else {
			const successfulMessage = successful.map(item => `- ${formatBulkSuccess(item)}`).join("\n");
			const unsuccessfulMessage = unsuccessful.map(item => `- ${formatBulkError(item)}`).join("\n");

			if (unsuccessful.length === 0) {
				await context.respond(
					`${icons.success} Timed out all **${args.user.length} users**:\n${successfulMessage}`
				);
			} else if (successful.length === 0) {
				await context.respond(
					`${icons.error} None of **${args.user.length} users** were timed out:\n${unsuccessfulMessage}`
				);
			} else {
				await context.respond(
					`${icons.warning} Only **${successful.length} of ${args.user.length} users** were timed out!\n`
					+ `Successful timeouts:\n${successfulMessage}\n`
					+ `Unsuccessful timeouts:\n${unsuccessfulMessage}`
				);
			}
		}
	},
});
