import { escapeMarkdown } from "#common/discord/markdown.ts";
import { dateToUnixSecs } from "#common/time.ts";
import { BOT_ALLOWED_GUILDS, BOT_STAFF } from "#environment.ts";
import { grantAccess, revokeAccess } from "#plugins/core/guildInfoSync.ts";
import { type CommandContext } from "#plugins/core/public/command.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import { snowflake } from "../public/helper/customOptionTypes.ts";

function checkBotStaff(ctx: CommandContext): boolean {
	return BOT_STAFF.includes(ctx.user.id);
}

const grantAccessCommand = defineCommand({
	name: ["grantaccess", "whitelist"],
	description: "Give a server access to the app.",
	supportSlash: false, // don't want this cluttering the command list

	options: {
		guild: {
			type: snowflake,
			name: ["server"],
			required: true,
			position: 0,
		},
	},

	preRun: checkBotStaff,
	async run(ctx, args) {
		const guildName =
			ctx.bot.guilds.get(args.guild)?.name ?? "<unknown server name>";

		if (await grantAccess(ctx.squirrelCtx, args.guild)) {
			await ctx.respond(
				`${icons.success} Granted access to **${escapeMarkdown(guildName)}**!`,
			);
		} else {
			await ctx.respond(
				`${icons.error} Server **${escapeMarkdown(guildName)}** already has access to the app!`,
			);
		}
	},
});

const revokeAccessCommand = defineCommand({
	name: ["revokeaccess", "unwhitelist"],
	description:
		"Remove a server's access to the app and schedule its data for deletion.",
	supportSlash: false,

	options: {
		guild: {
			type: snowflake,
			name: ["server"],
			required: true,
			position: 0,
		},
	},

	preRun: checkBotStaff,
	async run(ctx, args) {
		const guildName = ctx.bot.guilds.get(args.guild)?.name ?? "<unknown>";

		const result = await revokeAccess(ctx.squirrelCtx, args.guild);

		if (result !== false) {
			if (result instanceof Date) {
				await ctx.respond(
					`${icons.success} Revoked access for **${escapeMarkdown(guildName)}**! ` +
						`Plugin data will be purged on <t:${dateToUnixSecs(result)}:d>.`,
				);
			} else {
				await ctx.respond(
					`${icons.success} Revoked access for **${escapeMarkdown(guildName)}**! ` +
						"The server might still have access if it is configured in the environment.",
				);
			}
		} else {
			if (BOT_ALLOWED_GUILDS.includes(args.guild)) {
				await ctx.respond(
					`${icons.error} Server **${escapeMarkdown(guildName)}** cannot be removed as it is configured in the app's environment!`,
				);
			} else {
				await ctx.respond(
					`${icons.error} Server **${escapeMarkdown(guildName)}** does not have access to the app!`,
				);
			}
		}
	},
});

export default [grantAccessCommand, revokeAccessCommand];
