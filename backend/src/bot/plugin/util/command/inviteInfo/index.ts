import { DiscordRESTError, InviteTypes, JSONErrorCodes } from "oceanic.js";
import { moduleLogger } from "../../../../../common/logger/index.ts";
import { formatRESTError } from "../../../../common/discord/format.ts";
import { escapeMarkdown } from "../../../../common/discord/markdown.ts";
import { bot } from "../../../../index.ts";
import { defineCommand, OptionType, type CommandContainerComponent } from "../../../core/public/command.ts";
import { permissionsGuard } from "../../../core/public/helper/commandGuards.ts";
import { icons } from "../../../core/public/icons.ts";
import { utilConfig } from "../../index.ts";
import { renderFriendInvite } from "./friend.ts";
import { renderGroupDMInvite } from "./groupDM.ts";
import { renderGuildInvite } from "./guild.ts";

const REGEX = /^\s*(?:(?:https:\/\/)?(?:(?:(?:canary\.|ptb\.)?discord(?:app)?\.com\/invite)|(?:discord\.gg(?:\/invite)?))\/)?([A-Za-z0-9-]+)\s*$/;

const logger = moduleLogger();

export const inviteInfoCommand = defineCommand({
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

	preRun: context => permissionsGuard(context, utilConfig, permissions => permissions.invite_info_command),
	async run(context, args) {
		const matches = REGEX.exec(args.link);

		if (matches === null) {
			await context.respond(`${icons.error} Provided link does not contain invite code!`);
			return;
		}

		const code = matches[1]!;

		try {
			var invite = await bot.rest.channels.getInvite(code, {
				withCounts: true,
				withExpiration: true,
			});
		} catch (error) {
			if (!(error instanceof DiscordRESTError))
				throw error;

			if (error.code === JSONErrorCodes.UNKNOWN_INVITE)
				await context.respond(`${icons.error} Invite not found: '${escapeMarkdown(code)}'! This could be a friend invite or another type of invite invisible to bots.`);
			else
				await context.respond(`${icons.error} Invite fetch failed: ${formatRESTError(error)}`);

			return;
		}

		logger.debug?.(`Resolved invite '${code}'`, invite);

		let container: CommandContainerComponent;

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
			container = renderGroupDMInvite(invite.channel, invite.inviter, invite.approximateMemberCount, invite.expiresAt, args.hideImages ?? false);
		else {
			await context.respond(`${icons.error} Unknown invite type!`);
			return;
		}

		await context.respond({ components: [container] });
	},
});
