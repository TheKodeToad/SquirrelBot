import { BOT_ALLOWED_GUILDS } from "../../../../environment.ts";
import { escapeMarkdown } from "../../../common/discord/markdown.ts";
import { bot } from "../../../index.ts";
import { grantAccess, revokeAccess } from "../guildInfoSync.ts";
import { defineCommand, OptionType, type CommandContext } from "../public/command/index.ts";
import { icons } from "../public/icons.ts";

// for now
function checkForMe(context: CommandContext): boolean {
	return context.user.id === "706152404072267788";
}

export const grantAccessCommand = defineCommand({
	name: ["grant_access", "whitelist"],
	supportSlash: false, // don't want this cluttering the command list
	options: {
		guild: {
			type: OptionType.Snowflake,
			name: ["server"],
			required: true,
			position: 0,
		},
	},

	preRun: checkForMe,
	async run(context, args) {
		const guildName = bot.guilds.get(args.guild)?.name ?? "<unknown server name>";

		if (await grantAccess(args.guild))
			await context.respond(`${icons.success} Granted access to **${escapeMarkdown(guildName)}**!`);
		else
			await context.respond(`${icons.error} Server **${escapeMarkdown(guildName)}** already has access to the bot!`);
	},
});

export const revokeAccessCommand = defineCommand({
	name: ["revoke_access", "unwhitelist"],
	supportSlash: false,
	options: {
		guild: {
			type: OptionType.Snowflake,
			name: ["server"],
			required: true,
			position: 0,
		},
	},

	preRun: checkForMe,
	async run(context, args) {
		const guildName = bot.guilds.get(args.guild)?.name ?? "<unknown>";

		const result = await revokeAccess(args.guild);

		if (result !== false) {
			if (result instanceof Date)
				await context.respond(`${icons.success} Revoked access for **${escapeMarkdown(guildName)}**! Plugin data will be purged on <t:${Math.floor(result.getTime() / 1000)}:d>.`);
			else
				await context.respond(`${icons.success} Revoked access for **${escapeMarkdown(guildName)}**! The bot might still have access if it is configured in the environment.`);

		} else {
			if (BOT_ALLOWED_GUILDS.includes(args.guild))
				await context.respond(`${icons.error} Server **${escapeMarkdown(guildName)}** cannot be removed as it is configured in the bot's environment!`);
			else
				await context.respond(`${icons.error} Server **${escapeMarkdown(guildName)}** does not have access to the bot!`);
		}
	},
});