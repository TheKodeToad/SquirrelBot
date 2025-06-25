import { fetchMemberCached } from "#common/discord/cachedRequest.ts";
import { formatRESTError, formatUserBold } from "#common/discord/format.ts";
import { escapeMarkdown, makeMarkdownInlineCodeblock } from "#common/discord/markdown.ts";
import { coreConfigStore as coreConfigCache } from "#plugin/core/index.ts";
import { OptionType } from "#plugin/core/public/discord/command.ts";
import { defineCommand } from "#plugin/core/public/discord/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/discord/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/discord/icons.ts";
import { resolveGroups } from "#plugin/core/public/discord/permissionResolution.ts";
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
