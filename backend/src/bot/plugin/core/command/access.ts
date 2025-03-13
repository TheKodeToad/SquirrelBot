import { BOT_ALLOWED_GUILDS } from "../../../../environment.ts";
import { escape_markdown } from "../../../common/discord/markdown.ts";
import { bot } from "../../../index.ts";
import { grant_access, revoke_access } from "../guild_info_sync.ts";
import { define_command, OptionType } from "../public/command.ts";
import { icons } from "../public/icons.ts";

// for now
const ME = "706152404072267788";

export const grant_access_command = define_command({
	id: ["grant_access", "whitelist"],
	support_slash: false, // don't want this cluttering the command list
	options: {
		guild: {
			type: OptionType.SNOWFLAKE,
			id: "server",
			required: true,
			position: 0,
		},
	},
	async run(context, args) {
		if (context.user.id !== ME)
			return;

		const guild_name = bot.guilds.get(args.guild)?.name ?? "<unknown server name>";

		if (await grant_access(args.guild))
			context.respond(`${icons.success} Granted access to **${escape_markdown(guild_name)}**!`);
		else
			context.respond(`${icons.error} Server **${escape_markdown(guild_name)}** already has access to the bot!`);
	},
});

export const revoke_access_command = define_command({
	id: ["revoke_access", "unwhitelist"],
	support_slash: false,
	options: {
		guild: {
			type: OptionType.SNOWFLAKE,
			id: "server",
			required: true,
			position: 0,
		},
	},
	async run(context, args) {
		if (context.user.id !== ME)
			return;

		const guild_name = bot.guilds.get(args.guild)?.name ?? "<unknown>";

		const result = await revoke_access(args.guild);

		if (result !== false) {
			if (result instanceof Date)
				context.respond(`${icons.success} Revoked access for **${escape_markdown(guild_name)}**! Plugin data will be purged on <t:${Math.floor(result.getTime() / 1000)}:d>.`);
			else
				context.respond(`${icons.success} Revoked access for **${escape_markdown(guild_name)}**! The bot might still have access if it is configured in the environment.`);

		} else {
			if (BOT_ALLOWED_GUILDS.includes(args.guild))
				context.respond(`${icons.error} Server **${escape_markdown(guild_name)}** cannot be removed as it is configured in the bot's environment!`);
			else
				context.respond(`${icons.error} Server **${escape_markdown(guild_name)}** does not have access to the bot!`);
		}
	},
});