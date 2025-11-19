import { formatRESTError } from "#common/discord/format.ts";
import { escapeMarkdown } from "#common/discord/markdown.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { renderFriendInvite } from "#plugin/util/command/inviteInfo/friend.ts";
import { renderGroupDMInvite } from "#plugin/util/command/inviteInfo/groupDM.ts";
import { renderGuildInvite } from "#plugin/util/command/inviteInfo/guild.ts";
import { utilConfigStore } from "#plugin/util/index.ts";
import { Client, DiscordRESTError, InviteTypes, JSONErrorCodes, type ContainerComponent } from "oceanic.js";

const REGEX = /^\s*(?:(?:https:\/\/)?(?:(?:(?:canary\.|ptb\.)?discord(?:app)?\.com\/invite)|(?:discord\.gg(?:\/invite)?))\/)?([A-Za-z0-9-]+)\s*$/;

const logger = moduleLogger();

export default defineCommand({
	name: ["inviteinfo", "invite", "invinfo", "inv"],
	description: "Display information about a Discord invite by passing in the code or link.",

	trackUpdates: true,

	options: {
		link: {
			type: OptionType.String,
			name: ["link", "l"],
			required: true,
			position: 0
		},
		hideImages: {
			type: OptionType.Flag,
			name: ["hide-images", "h", "hi", "no-images"],
			description: "Do not display images in the invite information."
		}
	},

	preRun: ctx => permissionsGuard(ctx, utilConfigStore, permissions => permissions.invite_info_command),
	async run(ctx, args) {
		const matches = REGEX.exec(args.link);

		if (matches === null) {
			await ctx.respond(`${icons.error} Provided link does not contain invite code!`);
			return;
		}

		const code = matches[1]!;

		try {
			var invite = await stealthyGetInvite(ctx.bot, code);
		} catch (error) {
			if (!(error instanceof DiscordRESTError))
				throw error;

			if (error.code === JSONErrorCodes.UNKNOWN_INVITE)
				await ctx.respond(`${icons.error} Invite not found: '${escapeMarkdown(code)}'! It might not be visible to apps.`);
			else
				await ctx.respond(`${icons.error} Invite fetch failed: ${formatRESTError(error)}`);

			return;
		}

		logger.debug?.(`Resolved invite '${code}'`, invite);

		let container: ContainerComponent;

		if (invite.type === InviteTypes.GUILD && invite.guild !== null) {
			container = renderGuildInvite(
				invite.guild,
				invite.channel,
				invite.inviter,
				invite.approximatePresenceCount,
				invite.approximateMemberCount,
				invite.expiresAt,
				args.hideImages ?? false
			);
		} else if (invite.type === InviteTypes.FRIEND && invite.inviter !== undefined)
			container = renderFriendInvite(invite.inviter, invite.expiresAt, args.hideImages ?? false);
		else if (invite.type === InviteTypes.GROUP_DM && invite.channel !== null)
			container = renderGroupDMInvite(ctx.bot, invite.channel, invite.inviter, invite.approximateMemberCount, invite.expiresAt, args.hideImages ?? false);
		else {
			await ctx.respond(`${icons.error} Unknown invite type!`);
			return;
		}

		await ctx.respond({ components: [container] });
	},
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function stealthyGetInvite(bot: Client, code: string) {
	// HACK: I am very sorry
	// remove Bot prefix because Discord API lets you resolve more invites for some reason (??)

	const desc = Object.getOwnPropertyDescriptor(bot.options, "auth");
	const trivialDesc = desc !== undefined && desc.writable && desc.get === undefined && desc.set === undefined;

	const prefix = "Bot ";
	const oldValue = bot.options.auth;

	try {
		if (trivialDesc && bot.options.auth?.startsWith(prefix))
			bot.options.auth = bot.options.auth.substring(prefix.length);

		var result = bot.rest.channels.getInvite(code, {
			withCounts: true,
			withExpiration: true,
		});
	} finally {
		bot.options.auth = oldValue;
	}

	return result;
}

