import { CaseType } from "../../../../db/moderation/cases.ts";
import { escapeMarkdown } from "../../../common/discord/markdown.ts";
import { permissionsGuard } from "../../core/public/command/helper.ts";
import { OptionType, defineCommand } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";
import { doBatchAction } from "../helper/batch_action.ts";
import { moderationConfig } from "../index.ts";

export const banCommand = defineCommand({
	name: ["ban"],
	options: {
		user: {
			type: OptionType.USER,
			name: ["user", "u"],
			array: true,
			required: true,
			position: 0,
		},
		reason: {
			type: OptionType.STRING,
			name: ["reason", "r"],
			position: 1,
		},
		dm: {
			type: OptionType.FLAG,
			name: ["dm", "d", "direct-message"],
			negativeName: ["no-dm", "nd", "no-direct-message"],
		},
		purge: {
			type: OptionType.NUMBER,
			name: ["purge", "p", "delete"],
		},
	},

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.ban),
	async run(context, args, { config }) {
		const sendDirectMessage = args.dm ?? config.ban.send_direct_message;
		const directMessage = sendDirectMessage
			? config.ban.direct_message ?? {
				content: `You are permanently banned from ${escapeMarkdown(context.guild.name)}.`
			}
			: undefined;

		const deleteMessageSeconds = (args.purge ?? config.ban.purge_messages) * (1000 * 60 * 60 * 24);

		const { successful, unsuccessful } = await doBatchAction({
			guild: context.guild,
			ids: args.user,

			actor: context.member,
			directMessage: directMessage,

			membersOnly: false,

			async perform(user) {
				await context.guild.createBan(user.id, {
					reason: args.reason ?? undefined,
					deleteMessageSeconds: deleteMessageSeconds,
				});
			},
			makeCase(actor, target, dmDelivered) {
				return {
					type: CaseType.Ban,
					actorID: actor,
					targetID: target,
					reason: args.reason ?? undefined,
					deleteMessageSeconds: deleteMessageSeconds,
					dmDelivered: dmDelivered,
				};
			},
		});

		if (args.user.length === 1) {
			if (successful.length === 1) {
				const ban = successful[0]!;
				await context.respond(`${icons.success} Banned <@${ban.id}> (${escapeMarkdown(ban.name)})${ban.dmDelivered ? " with direct message" : ""} [#${ban.caseNumber}]!`);
			} else if (unsuccessful.length === 1) {
				const ban = unsuccessful[0]!;
				await context.respond(`${icons.error} Could not ban <@${ban.id}> (${escapeMarkdown(ban.name ?? "<unknown>")}): ${escapeMarkdown(ban.error)}!`);
			}
		} else {
			const successfulMessage = successful.map(ban => `- <@${ban.id}> (${escapeMarkdown(ban.name)})${ban.dmDelivered ? " with direct message" : ""} [#${ban.caseNumber}]`).join("\n");
			const unsuccessfulMessage = unsuccessful.map(ban => `- <@${ban.id}> (${escapeMarkdown(ban.name ?? "<unknown>")}): ${escapeMarkdown(ban.error)}`).join("\n");

			if (unsuccessful.length === 0) {
				await context.respond(
					`${icons.success} Banned all ${args.user.length} users:\n${successfulMessage}`
				);
			} else if (successful.length === 0) {
				await context.respond(
					`${icons.error} None of ${args.user.length} users were banned:\n${unsuccessfulMessage}`
				);
			} else {
				await context.respond(
					`${icons.warning} Only ${successful.length} of ${args.user.length} bans were successful!\n`
					+ `Successful bans:\n${successfulMessage}\n`
					+ `Unsuccessful bans:\n${unsuccessfulMessage}`
				);
			}
		}
	},
});
