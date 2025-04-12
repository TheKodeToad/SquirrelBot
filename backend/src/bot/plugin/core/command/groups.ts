import { DiscordRESTError, JSONErrorCodes } from "oceanic.js";
import { getMemberCached } from "../../../common/discord/cache.ts";
import { formatRESTError } from "../../../common/discord/format.ts";
import { escapeMarkdown, makeInlineCodeblock } from "../../../common/discord/markdown.ts";
import { coreConfig as coreConfigCache } from "../index.ts";
import { permissionsGuard } from "../public/command/helper.ts";
import { defineCommand, OptionType } from "../public/command/index.ts";
import { icons } from "../public/icons.ts";
import { resolveGroups } from "../public/permission_resolution.ts";

export const groupsCommand = defineCommand({
	name: ["groups"],
	trackUpdates: true,
	options: {
		user: {
			type: OptionType.USER,
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
				member = await getMemberCached(context.guild, args.user);
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
			const groups = Array.from(result.groups).toSorted().map(makeInlineCodeblock);
			await context.respond(`${icons.info} Groups for <@${member.id}> (${escapeMarkdown(member.tag)}): ${groups} (permission level ${result.level})`);
		} else
			await context.respond(`${icons.info} <@${member.id}> (${escapeMarkdown(member.tag)}) is not in any groups!`);
	},
});