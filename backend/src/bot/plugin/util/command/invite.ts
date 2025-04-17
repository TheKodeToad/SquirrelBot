import { ChannelTypes, DiscordRESTError, InviteTypes, JSONErrorCodes, type EmbedOptions } from "oceanic.js";
import { moduleLogger } from "../../../../common/logger/index.ts";
import { dateToUnixSeconds } from "../../../../common/time.ts";
import { Colors } from "../../../common/discord/colors.ts";
import { formatRESTError, formatUser } from "../../../common/discord/format.ts";
import { escapeMarkdown } from "../../../common/discord/markdown.ts";
import { bot } from "../../../index.ts";
import { defineCommand, OptionType } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";

const REGEX = /^\s*(?:(?:https:\/\/)?(?:(?:(?:canary\.|ptb\.)?discord(?:app)?\.com\/invite)|(?:discord\.gg(?:\/invite)?))\/)?([A-Za-z0-9-]+)\s*$/;

const logger = moduleLogger();

// TODO: escape things lol

export const inviteCommand = defineCommand({
	name: ["invite", "inv"],
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
			name: ["hide-images", "hi"]
		}
	},

	preRun: () => true,
	async run(context, args) {
		const matches = REGEX.exec(args.link);

		if (matches === null) {
			await context.respond(`${icons.error} Provided link does not contain invite code!`);
			return;
		}

		const code = matches[1]!;

		try {
			const invite = await bot.rest.channels.getInvite(code, {
				withCounts: true,
				withExpiration: true,
			});

			logger.debug?.(`Resolved invite '${code}'`, invite);

			var {
				type,
				guild,
				channel,
				approximateMemberCount,
				approximatePresenceCount,
				inviter,
				expiresAt,
			} = invite;
		} catch (error) {
			if (!(error instanceof DiscordRESTError))
				throw error;

			if (error.code === JSONErrorCodes.UNKNOWN_INVITE)
				await context.respond(`${icons.error} Invite not found: '${escapeMarkdown(code)}'! This could be a friend invite or another type of invite invisible to bots.`);
			else
				await context.respond(`${icons.error} Invite fetch failed: ${formatRESTError(error)}`);

			return;
		}

		const embed: EmbedOptions = { color: Colors.blurple };

		embed.fields = [];

		if (type === InviteTypes.GUILD && guild !== null) {
			embed.author = { name: guild.name };

			const iconURL = guild.iconURL();

			if (iconURL !== null && !args.hideImages)
				embed.author.iconURL = iconURL;

			const bannerURL = guild.bannerURL();

			if (bannerURL !== null && !args.hideImages)
				embed.image = { url: bannerURL };

			embed.description = "";

			if (approximateMemberCount !== undefined && approximatePresenceCount !== undefined) {
				const online = approximatePresenceCount.toLocaleString("en-US");
				const total = approximateMemberCount.toLocaleString("en-US");
				embed.description += `${icons.online} ${online} Online  ${icons.offline} ${total} Total\n`;
			}

			embed.description += `${icons.boost} ${guild.premiumSubscriptionCount ?? 0} Boosts`;

			if (guild.description !== null) {
				embed.fields.push({
					name: "Description",
					value: escapeMarkdown(guild.description)
				});
			}

			if (channel !== null && channel.name !== null) {
				embed.fields.push({
					name: "Channel",
					value: escapeMarkdown(`${channel.name} (${channel.id})`)
				});
			}

			embed.footer = { text: "" };

			if (guild.vanityURLCode !== null)
				embed.footer.text += escapeMarkdown("discord.gg/" + guild.vanityURLCode) + " • ";

			embed.footer.text += "Server ID: " + guild.id;
		} else if (type === InviteTypes.FRIEND && inviter !== undefined) {
			embed.author = { name: inviter.tag || "<unknown>" + " (friend)" };
			embed.footer = { text: "" };
		}
		else if (type === InviteTypes.GROUP_DM && channel?.type === ChannelTypes.GROUP_DM) {
			embed.author = { name: channel.name || "<unknown>" + " (group)" };

			if (channel.icon !== undefined)
				embed.author.iconURL = `https://cdn.discordapp.com/channel-icons/${channel.id}/${channel.icon}.${bot.options.defaultImageFormat}?size=${bot.options.defaultImageSize}`;

			if (approximateMemberCount !== undefined)
				embed.description = approximateMemberCount + " Members";
		} else
			embed.author = { name: "Unknown Invite" };

		if (expiresAt !== undefined) {
			const expirySecs = dateToUnixSeconds(expiresAt);

			embed.fields.push({
				name: "Expires At",
				value: `<t:${expirySecs}> (<t:${expirySecs}:R>)`
			});
		}

		if (inviter !== undefined) {
			embed.fields.push({
				name: "Invited By",
				value: formatUser(context.user)
			});
		}

		await context.respond({ embeds: [embed] });
	},
});