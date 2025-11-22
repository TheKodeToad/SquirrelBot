import { fetchMemberCached } from "#common/discord/cachedRequest.ts";
import { formatRESTError, formatUserBold } from "#common/discord/format.ts";
import { escapeMarkdown, makeMarkdownInlineCodeblock } from "#common/discord/markdown.ts";
import { coreConfigStore as coreConfigCache } from "#plugin/core/index.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { resolveGroups } from "#plugin/core/public/permissionResolution.ts";
import { DiscordRESTError, JSONErrorCodes } from "oceanic.js";

export default defineCommand({
	name: ["groups"],
	description: "View the groups a user is in.",
	trackUpdates: true,

	options: {
		user: {
			type: OptionType.User,
			name: ["user", "u"],
			position: 0,
		}
	},

	preRun: ctx => permissionsGuard(ctx, coreConfigCache, permissions => permissions.groups_command),
	async run(ctx, args) {
		const coreConfig = coreConfigCache.get(ctx.guild.id);

		if (coreConfig === undefined) {
			return;
		}

		let member = ctx.member;

		if (args.user !== null) {
			try {
				member = await fetchMemberCached(ctx.bot, ctx.guild, args.user);
			} catch (error) {
				if (!(error instanceof DiscordRESTError)) {
					throw error;
				}

				if (error.code === JSONErrorCodes.UNKNOWN_MEMBER) {
					await ctx.respond(`${icons.error} The specified user is not a member of the server!`);
					return;
				}

				await ctx.respond(`${icons.error} User fetch failed: ${escapeMarkdown(formatRESTError(error))}!`);
				return;
			}
		}

		const result = resolveGroups(member);

		if (result.groups.size !== 0) {
			const groups = Array.from(result.groups).toSorted().map(makeMarkdownInlineCodeblock);
			await ctx.respond(`${icons.info} Groups for ${formatUserBold(ctx.user)}: ${groups.join(", ")} (permission level ${result.level})`);
		} else {
			await ctx.respond(`${icons.info} ${formatUserBold(ctx.user)} is not in any groups!`);
		}
	},
});
