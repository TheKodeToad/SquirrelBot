import { DiscordRESTError } from "oceanic.js";
import { CoreConfig } from "../../../../schema/core/config";
import { get_member_cached } from "../../../common/discord/cache";
import { format_rest_error } from "../../../common/discord/format";
import { escape_markdown } from "../../../common/discord/markdown";
import { icons } from "../../../icons";
import { test_group } from "../../../permission_resolution";
import { define_command, OptionType } from "../../../types/command";
import { core_config as core_config_cache } from "../../core";

export const groups_command = define_command({
	id: "groups",
	track_updates: true,
	options: {
		user: {
			type: OptionType.USER,
			id: ["user", "u"],
			position: 0,
		},
	},
	async run(context, args) {
		const core_config = core_config_cache.get(context.guild.id);

		if (core_config === undefined)
			return;

		if (args.user === null)
			var { member } = context;
		else {
			try {
				var member = await get_member_cached(context.guild, args.user);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				await context.respond(`${icons.error} User fetch failed: ${format_rest_error(error)}!`);
				return;
			}
		}

		const roles = new Set(member.roles);

		const groups = Object
			.entries(core_config.groups)
			.filter(([_, value]) => test_group(value, member.user, roles, context.channel));

		if (groups.length !== 0) {
			let formatted = groups.map(([key, _]) => format_group(core_config.groups, key)).join("\n");
			await context.respond(`**${icons.info} Group tree for <@${member.id}> (${escape_markdown(member.tag)}) in <#${context.channel.id}>**\n\`\`\`${formatted}\`\`\``);
		} else {
			await context.respond(`${icons.error} No groups for <@${member.id}> (${escape_markdown(member.tag)}) in <#${context.channel}!`);
		}
	},
});

function format_group(groups: CoreConfig["groups"], id: string, level: number = 0): string {
	const group = groups[id];

	let prefix = "│  ".repeat(level) + "├──";

	if (group === undefined)
		return prefix + id + " (invalid!)";

	let result = prefix + id;

	if (level !== 0)
		result += " (inherited)";
	else
		result += " (matched)";

	for (const reference of group.inherits) {
		result += "\n";
		result += format_group(groups, reference, level + 1);
	}

	return result;
}