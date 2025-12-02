import { fetchUserCachedSupressed } from "#common/discord/cachedRequest.ts";
import { formatRESTError } from "#common/discord/formatting.ts";
import { permissionsGuard } from "#plugins/core/public/commandGuards.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import { MemberRanking } from "#plugins/moderation/config.ts";
import {
	formatModActionFailure,
	formatModActionSuccess,
} from "#plugins/moderation/formatting.ts";
import {
	performModAction,
	type ModAction,
	type ModActionFailure,
} from "#plugins/moderation/modAction.ts";
import { moderationConfigStore } from "#plugins/moderation/plugin.ts";
import {
	ModEventType,
	type ModEvent,
} from "#plugins/moderation/public/modEvent.ts";
import { DiscordRESTError, JSONErrorCodes } from "oceanic.js";

export default defineCommand({
	name: ["unban"],
	description: "Remove a ban on a user.",

	options: {
		user: {
			type: "user",
			name: ["user", "u"],
			array: true,
			required: true,
			position: 0,
		},
		reason: {
			type: "string",
			name: ["reason", "r"],
			position: 1,
		},
	},

	preRun: (ctx) =>
		permissionsGuard(ctx, moderationConfigStore, (perms) => perms.unban),
	async run(ctx, args) {
		const successful: ModEvent[] = [];
		const unsuccessful: ModActionFailure[] = [];

		for (const target of args.user) {
			const cachedMember = ctx.guild.members.get(target);
			if (cachedMember !== undefined) {
				unsuccessful.push({
					target: cachedMember.user,
					error: "User is not banned",
				});
				continue;
			}

			try {
				var ban = await ctx.guild.getBan(target);
			} catch (error) {
				if (!(error instanceof DiscordRESTError)) {
					throw error;
				}

				if (error.code === JSONErrorCodes.UNKNOWN_BAN) {
					unsuccessful.push({
						target: await fetchUserCachedSupressed(ctx.bot, target),
						error: "User is not banned",
					});
				} else {
					const user =
						error.code === JSONErrorCodes.UNKNOWN_USER ?
							{ id: target }
						:	await fetchUserCachedSupressed(ctx.bot, target);

					unsuccessful.push({
						target: user,
						error: `Ban fetch failed: ${formatRESTError(error)}`,
					});
				}

				continue;
			}

			const action: ModAction = {
				guild: ctx.guild,

				type: ModEventType.Unban,

				actor: ctx.member,
				target: ban.user,
				ranking: MemberRanking.None,

				reason: args.reason ?? undefined,
			};

			const actionResult = await performModAction(ctx.backendCtx, action);

			if ("error" in actionResult) {
				unsuccessful.push(actionResult);
			} else {
				successful.push(actionResult);
			}
		}

		if (args.user.length === 1) {
			if (successful.length === 1) {
				await ctx.respond(
					`${icons.success} Unbanned ${formatModActionSuccess(successful[0]!)}!`,
				);
			} else if (unsuccessful.length === 1) {
				await ctx.respond(
					`${icons.error} Could not unban ${formatModActionFailure(unsuccessful[0]!)}!`,
				);
			}
		} else {
			const successfulMessage = successful
				.map((item) => `- ${formatModActionSuccess(item)}`)
				.join("\n");
			const unsuccessfulMessage = unsuccessful
				.map((item) => `- ${formatModActionFailure(item)}`)
				.join("\n");

			if (unsuccessful.length === 0) {
				await ctx.respond(
					`${icons.success} Unbanned all **${args.user.length} users**:\n${successfulMessage}`,
				);
			} else if (successful.length === 0) {
				await ctx.respond(
					`${icons.error} None of **${args.user.length} users** were unbanned:\n${unsuccessfulMessage}`,
				);
			} else {
				await ctx.respond(
					`${icons.warning} Only **${successful.length} of ${args.user.length} users** were unbanned!\n`
						+ `Successful:\n${successfulMessage}\n`
						+ `Unsuccessful:\n${unsuccessfulMessage}`,
				);
			}
		}
	},
});
