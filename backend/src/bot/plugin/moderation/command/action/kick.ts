import { escapeMarkdown } from "#bot/common/discord/markdown.ts";
import { OptionType, defineCommand } from "#bot/plugin/core/public/command.ts";
import { permissionsGuard } from "#bot/plugin/core/public/helper/commandGuards.ts";
import { icons } from "#bot/plugin/core/public/icons.ts";
import { doBulkAction } from "#bot/plugin/moderation/helper/bulkAction.ts";
import { formatBulkError, formatBulkSuccess } from "#bot/plugin/moderation/helper/format.ts";
import { moderationConfig } from "#bot/plugin/moderation/index.ts";
import { CaseType } from "#db/moderation/cases.ts";
import type { CreateMessageOptions } from "oceanic.js";

export const kickCommand = defineCommand({
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

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.kick),
	async run(context, args, { config }) {
		const sendDirectMessage = args.dm ?? config.ban.send_direct_message;
		const directMessage: CreateMessageOptions | undefined =
			sendDirectMessage ?
				config.ban.direct_message?.({
					server: context.guild,
					moderator: context.user,
					reason: args.reason ?? undefined,
				}) ?? { content: `You were kicked from **${escapeMarkdown(context.guild.name)}**.` } :
				undefined;

		const { successful, unsuccessful } = await doBulkAction({
			guild: context.guild,
			ids: args.user,

			actor: context.member,
			directMessage: directMessage,

			membersOnly: true,

			perform: async member => await context.guild.removeMember(member.id, args.reason ?? undefined),
			makeCase(options) {
				return {
					...options,
					type: CaseType.Kick,
					reason: args.reason ?? undefined,
				};
			},
		});

		if (args.user.length === 1) {
			if (successful.length === 1)
				await context.respond(`${icons.success} Kicked ${formatBulkSuccess(successful[0]!)}!`);
			else if (unsuccessful.length === 1)
				await context.respond(`${icons.error} Could not kick ${formatBulkError(unsuccessful[0]!)}!`);
		} else {
			const successfulMessage = successful.map(item => `- ${formatBulkSuccess(item)}`).join("\n");
			const unsuccessfulMessage = unsuccessful.map(item => `- ${formatBulkError(item)}`).join("\n");

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
