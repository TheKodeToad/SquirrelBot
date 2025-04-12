import { DiscordRESTError, JSONErrorCodes } from "oceanic.js";
import { CaseType, createCase } from "../../../../db/moderation/cases.ts";
import { formatRESTError, formatUserTag } from "../../../common/discord/format.ts";
import { escapeMarkdown } from "../../../common/discord/markdown.ts";
import { permissionsGuard } from "../../core/public/command/helper.ts";
import { OptionType, defineCommand } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";
import { moderationConfig } from "../index.ts";

export const unbanCommand = defineCommand({
	name: ["unban"],
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
	},

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.unban),
	async run(context, args) {
		let successfulUnbans: { caseNumber: number, id: string, name: string; }[] = [];
		let unsuccessfulUnbans: { id: string, name: string, error: string; }[] = [];

		for (const target of args.user) {
			const cachedMember = context.guild.members.get(target);
			if (cachedMember !== undefined) {
				unsuccessfulUnbans.push({
					id: target,
					name: cachedMember.tag,
					error: "User is not banned",
				});
				continue;
			}

			try {
				var ban = await context.guild.getBan(target);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				if (error.code === JSONErrorCodes.UNKNOWN_BAN) {
					unsuccessfulUnbans.push({
						id: target,
						name: await formatUserTag(target),
						error: "User is not banned",
					});
				} else {
					unsuccessfulUnbans.push({
						id: target,
						name: error.code === JSONErrorCodes.UNKNOWN_USER ? "<unknown>" : await formatUserTag(target),
						error: `Ban fetch failed: ${formatRESTError(error)}`,
					});
				}

				continue;
			}

			try {
				await context.guild.removeBan(target, args.reason ?? undefined);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				unsuccessfulUnbans.push({ id: target, name: ban.user.tag, error: formatRESTError(error) });
				continue;
			}

			const caseNumber = await createCase(context.guild.id, {
				type: CaseType.Unban,
				actorID: context.user.id,
				targetID: target,
				reason: args.reason ?? undefined,
			});

			successfulUnbans.push({ caseNumber: caseNumber, id: target, name: ban.user.tag });
		}

		if (args.user.length === 1) {
			if (successfulUnbans.length === 1) {
				const unban = successfulUnbans[0]!;
				await context.respond(`${icons.success} Unbanned <@${unban.id}> (${escapeMarkdown(unban.name)}) [#${unban.caseNumber}]!`);
			} else if (unsuccessfulUnbans.length === 1) {
				const unban = unsuccessfulUnbans[0]!;
				await context.respond(`${icons.error} Could not unban <@${unban.id}> (${escapeMarkdown(unban.name)}): ${escapeMarkdown(unban.error)}!`);
			}
		} else {
			const successfulMessage = successfulUnbans.map(unban => `- <@${unban.id}> (${escapeMarkdown(unban.name)}) [#${unban.caseNumber}]`).join("\n");
			const unsuccessfulMessage = unsuccessfulUnbans.map(unban => `- <@${unban.id}> (${escapeMarkdown(unban.name)}): ${unban.error}`).join("\n");

			if (unsuccessfulUnbans.length === 0) {
				await context.respond(
					`${icons.success} Unbanned all ${args.user.length} users:\n${successfulMessage}`
				);
			} else if (successfulUnbans.length === 0) {
				await context.respond(
					`${icons.error} None of ${args.user.length} users were unbanned:\n${unsuccessfulMessage}`
				);
			} else {
				await context.respond(
					`${icons.warning} Only ${successfulUnbans.length} of ${args.user.length} unbans were successful!\n`
					+ `Successful unbans:\n${successfulMessage}\n`
					+ `Unsuccessful unbans:\n${unsuccessfulMessage}`
				);
			}
		}
	},
});
