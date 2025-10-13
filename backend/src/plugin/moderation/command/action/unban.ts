import { fetchUserCachedSupressed } from "#common/discord/cachedRequest.ts";
import { formatRESTError } from "#common/discord/format.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { MemberRanking } from "#plugin/moderation/config.ts";
import { formatModActionFailure, formatModActionSuccess } from "#plugin/moderation/helper/format.ts";
import { performModAction, type ModAction, type ModActionFailure } from "#plugin/moderation/helper/modAction.ts";
import { moderationConfigStore } from "#plugin/moderation/index.ts";
import { ModEventType, type ModEvent} from "#plugin/moderation/public/modEvent.ts";
import { DiscordRESTError, JSONErrorCodes } from "oceanic.js";

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
		const successful: ModEvent[] = [];
		const unsuccessful: ModActionFailure[] = [];

		for (const target of args.user) {
			const cachedMember = context.guild.members.get(target);
			if (cachedMember !== undefined) {
				unsuccessful.push({
					target: cachedMember.user,
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
						target: await fetchUserCachedSupressed(target),
						error: "User is not banned",
					});
				} else {
					const user = error.code === JSONErrorCodes.UNKNOWN_USER
						? { id: target }
						: await fetchUserCachedSupressed(target);

					unsuccessful.push({
						target: user,
						error: `Ban fetch failed: ${formatRESTError(error)}`,
					});
				}

				continue;
			}

			const action: ModAction = {
				guild: context.guild,

				type: ModEventType.Unban,

				actor: context.member,
				target: ban.user,
				ranking: MemberRanking.None,

				reason: args.reason ?? undefined,
			};

			const actionResult = await performModAction(action);

			if ("error" in actionResult)
				unsuccessful.push(actionResult);
			else
				successful.push(actionResult);
		}

		if (args.user.length === 1) {
			if (successful.length === 1)
				await context.respond(`${icons.success} Unbanned ${formatModActionSuccess(successful[0]!)}!`);
			else if (unsuccessful.length === 1)
				await context.respond(`${icons.error} Could not unban ${formatModActionFailure(unsuccessful[0]!)}!`);
		} else {
			const successfulMessage = successful.map(item => `- ${formatModActionSuccess(item)}`).join("\n");
			const unsuccessfulMessage = unsuccessful.map(item => `- ${formatModActionFailure(item)}`).join("\n");

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
					`${icons.warning} Only **${successful.length} of ${args.user.length} users** were unbanned!\n`
					+ `Successful:\n${successfulMessage}\n`
					+ `Unsuccessful:\n${unsuccessfulMessage}`
				);
			}
		}
	},
});
