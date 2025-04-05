import { DiscordRESTError, JSONErrorCodes } from "oceanic.js";
import { get_member_cached } from "../../../common/discord/cache.ts";
import { format_rest_error } from "../../../common/discord/format.ts";
import { escape_markdown, make_inline_codeblock } from "../../../common/discord/markdown.ts";
import { core_config, core_config as core_config_cache } from "../index.ts";
import { permissions_guard } from "../public/command/helper.ts";
import { define_command, OptionType } from "../public/command/index.ts";
import { icons } from "../public/icons.ts";
import { resolve_groups } from "../public/permission_resolution.ts";

export const groups_command = define_command({
	id: "groups",
	track_updates: true,
	options: {
		user: {
			type: OptionType.USER,
			id: ["user", "u"],
			position: 0,
		}
	},

	pre_run: context => permissions_guard(context, core_config, permissions => permissions.groups_command),

	async run(context, args) {
		const core_config = core_config_cache.get(context.guild.id);

		if (core_config === undefined)
			return;

		let member = context.member;

		if (args.user !== null) {
			try {
				member = await get_member_cached(context.guild, args.user);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				if (error.code === JSONErrorCodes.UNKNOWN_MEMBER) {
					await context.respond(`${icons.error} The specified user is not a member of the server!`);
					return;
				}

				await context.respond(`${icons.error} User fetch failed: ${escape_markdown(format_rest_error(error))}!`);
				return;
			}
		}

		const result = resolve_groups(member);

		if (result.groups.size !== 0) {
			const groups = Array.from(result.groups).toSorted().map(make_inline_codeblock);
			await context.respond(`${icons.info} Groups for <@${member.id}> (${escape_markdown(member.tag)}): ${groups} (permission level ${result.level})`);
		} else
			await context.respond(`${icons.info} <@${member.id}> (${escape_markdown(member.tag)}) is not in any groups!`);
	},
});