import { AnyGuildChannel, DiscordRESTError, JSONErrorCodes } from "oceanic.js";
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
		channel: {
			type: OptionType.CHANNEL,
			id: ["channel", "c"],
			position: 1
		}
	},
	async run(context, args) {
		const core_config = core_config_cache.get(context.guild.id);

		if (core_config === undefined)
			return;

		let member = context.member;
		let channel: AnyGuildChannel = context.channel;

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

		if (args.channel !== null) {
			const cached_channel = context.guild.channels.get(args.channel) ?? context.guild.threads.get(args.channel);

			if (cached_channel === undefined) {
				await context.respond(`${icons.error} The specified channel is not available in the server!`);
				return;
			}

			channel = cached_channel;
		}

		const roles = new Set(member.roles);

		const groups = Object
			.entries(core_config.groups)
			.filter(([_, value]) => test_group(value, member.user, roles, channel));

		if (groups.length !== 0) {
			let formatted = groups.map(([key, _]) => format_group(core_config.groups, key)).join("\n");
			await context.respond(`**Groups for <@${member.id}> (${escape_markdown(member.tag)}) in <#${channel.id}>**\n\`\`\`${formatted}\`\`\``);
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

	for (const reference of group.inherits) {
		result += "\n";
		result += format_group(groups, reference, level + 1);
	}

	return result;
}