import { fetchMemberCached } from "#bot/common/discord/cachedRequest.ts";
import { formatRESTError, formatUserBold } from "#bot/common/discord/format.ts";
import { escapeMarkdown, makeMarkdownInlineCodeblock } from "#bot/common/discord/markdown.ts";
import { coreConfig as coreConfigCache } from "#bot/plugin/core/index.ts";
import { defineCommand, OptionType } from "#bot/plugin/core/public/command.ts";
import { permissionsGuard } from "#bot/plugin/core/public/helper/commandGuards.ts";
import { icons } from "#bot/plugin/core/public/icons.ts";
import { resolveGroups } from "#bot/plugin/core/public/permissionResolution.ts";
import { DiscordRESTError, JSONErrorCodes } from "oceanic.js";

export const groupsCommand = defineCommand({
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

	preRun: context => permissionsGuard(context, coreConfigCache, permissions => permissions.groups_command),
	async run(context, args) {
		const coreConfig = coreConfigCache.get(context.guild.id);

		if (coreConfig === undefined)
			return;

		let member = context.member;

		if (args.user !== null) {
			try {
				member = await fetchMemberCached(context.guild, args.user);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				if (error.code === JSONErrorCodes.UNKNOWN_MEMBER) {
					await context.respond(`${icons.error} The specified user is not a member of the server!`);
					return;
				}

				await context.respond(`${icons.error} User fetch failed: ${escapeMarkdown(formatRESTError(error))}!`);
				return;
			}
		}

		const result = resolveGroups(member);

		if (result.groups.size !== 0) {
			const groups = Array.from(result.groups).toSorted().map(makeMarkdownInlineCodeblock);
			await context.respond(`${icons.info} Groups for ${formatUserBold(context.user)}: ${groups.join(", ")} (permission level ${result.level})`);
		} else
			await context.respond(`${icons.info} ${formatUserBold(context.user)} is not in any groups!`);
	},
});
