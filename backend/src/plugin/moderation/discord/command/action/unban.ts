import { fetchUserCachedSupressed } from "#common/discord/cachedRequest.ts";
import { formatRESTError, formatUserBold } from "#common/discord/format.ts";
import { escapeMarkdown } from "#common/discord/markdown.ts";
import { OptionType } from "#plugin/core/public/discord/command.ts";
import { defineCommand } from "#plugin/core/public/discord/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/discord/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/discord/icons.ts";
import { moderationConfigStore } from "#plugin/moderation/index.ts";
import { CaseType, createCase } from "#plugin/moderation/storage/cases.ts";
import { DiscordRESTError, JSONErrorCodes, User, type Uncached } from "oceanic.js";

export default defineCommand({
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

	preRun: context => permissionsGuard(context, moderationConfigStore, permissions => permissions.unban),
	async run(context, args) {
		const successful: { user: User; caseNumber: number; }[] = [];
		const unsuccessful: { user: User | Uncached; error: string; }[] = [];

		for (const target of args.user) {
			const cachedMember = context.guild.members.get(target);
			if (cachedMember !== undefined) {
				unsuccessful.push({
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
					unsuccessful.push({
						user: await fetchUserCachedSupressed(target),
						error: "User is not banned",
					});
				} else {
					const user = error.code === JSONErrorCodes.UNKNOWN_USER
						? { id: target }
						: await fetchUserCachedSupressed(target);

					unsuccessful.push({
						user,
						error: `Ban fetch failed: ${formatRESTError(error)}`,
					});
				}

				continue;
			}

			// consistent with bulkAction
			const createdAt = new Date;

			try {
				await context.guild.removeBan(target, args.reason ?? undefined);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				unsuccessful.push({ user: ban.user, error: formatRESTError(error) });
				continue;
			}

			const caseNumber = await createCase(context.guild.id, {
				createdAt,
				type: CaseType.Unban,
				actorID: context.user.id,
				targetID: target,
				reason: args.reason ?? undefined,
			});

			successful.push({ caseNumber: caseNumber, user: ban.user });
		}

		if (args.user.length === 1) {
			if (successful.length === 1) {
				const unban = successful[0]!;
				await context.respond(`${icons.success} Unbanned ${formatUserBold(unban.user)} (case #${unban.caseNumber})!`);
			} else if (unsuccessful.length === 1) {
				const unban = unsuccessful[0]!;
				await context.respond(`${icons.error} Could not unban ${formatUserBold(unban.user)}: ${escapeMarkdown(unban.error)}!`);
			}
		} else {
			const successfulMessage = successful.map(unban => `- ${formatUserBold(unban.user)} (case #${unban.caseNumber})`).join("\n");
			const unsuccessfulMessage = unsuccessful.map(unban => `- ${formatUserBold(unban.user)}: ${unban.error}`).join("\n");

			if (unsuccessful.length === 0) {
				await context.respond(
					`${icons.success} Unbanned all **${args.user.length} users**:\n${successfulMessage}`
				);
			} else if (successful.length === 0) {
				await context.respond(
					`${icons.error} None of **${args.user.length} users** were unbanned:\n${unsuccessfulMessage}`
				);
			} else {
				await context.respond(
					`${icons.warning} Only **${successful.length} of ${args.user.length} users** unbanned!\n`
					+ `Successful unbans:\n${successfulMessage}\n`
					+ `Unsuccessful unbans:\n${unsuccessfulMessage}`
				);
			}
		}
	},
});
