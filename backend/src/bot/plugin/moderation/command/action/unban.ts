import { DiscordRESTError, JSONErrorCodes, User, type Uncached } from "oceanic.js";
import { CaseType, createCase } from "../../../../../db/moderation/cases.ts";
import { fetchUserCachedSupressed } from "../../../../common/discord/cachedRequest.ts";
import { formatRESTError, formatUser } from "../../../../common/discord/format.ts";
import { escapeMarkdown } from "../../../../common/discord/markdown.ts";
import { OptionType, defineCommand } from "../../../core/public/command.ts";
import { permissionsGuard } from "../../../core/public/helper/commandGuards.ts";
import { icons } from "../../../core/public/icons.ts";
import { moderationConfig } from "../../index.ts";

export const unbanCommand = defineCommand({
	name: ["unban"],
	description: "Remove a ban on a user.",

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
	},

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.unban),
	async run(context, args) {
		let successfulUnbans: { user: User; caseNumber: number; }[] = [];
		let unsuccessfulUnbans: { user: User | Uncached; error: string; }[] = [];

		for (const target of args.user) {
			const cachedMember = context.guild.members.get(target);
			if (cachedMember !== undefined) {
				unsuccessfulUnbans.push({
					user: cachedMember.user,
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
						user: await fetchUserCachedSupressed(target),
						error: "User is not banned",
					});
				} else {
					const user = error.code === JSONErrorCodes.UNKNOWN_USER
						? { id: target }
						: await fetchUserCachedSupressed(target);

					unsuccessfulUnbans.push({
						user,
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

				unsuccessfulUnbans.push({ user: ban.user, error: formatRESTError(error) });
				continue;
			}

			const caseNumber = await createCase(context.guild.id, {
				type: CaseType.Unban,
				actorID: context.user.id,
				targetID: target,
				reason: args.reason ?? undefined,
			});

			successfulUnbans.push({ caseNumber: caseNumber, user: ban.user });
		}

		if (args.user.length === 1) {
			if (successfulUnbans.length === 1) {
				const unban = successfulUnbans[0]!;
				await context.respond(`${icons.success} Unbanned ${formatUser(unban.user)} [#${unban.caseNumber}]!`);
			} else if (unsuccessfulUnbans.length === 1) {
				const unban = unsuccessfulUnbans[0]!;
				await context.respond(`${icons.error} Could not unban ${formatUser(unban.user)}: ${escapeMarkdown(unban.error)}!`);
			}
		} else {
			const successfulMessage = successfulUnbans.map(unban => `- ${formatUser(unban.user)} [#${unban.caseNumber}]`).join("\n");
			const unsuccessfulMessage = unsuccessfulUnbans.map(unban => `- ${formatUser(unban.user)}: ${unban.error}`).join("\n");

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
