import { ChannelTypes, DiscordRESTError, InviteTypes, JSONErrorCodes, type EmbedOptions } from "oceanic.js";
import { module_logger } from "../../../../common/logger/index.ts";
import { Colors } from "../../../common/discord/colors.ts";
import { format_rest_error } from "../../../common/discord/format.ts";
import { bot } from "../../../index.ts";
import { define_command, OptionType } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";


const REGEX = /^\s*(?:(?:https:\/\/)?(?:(?:(?:canary\.|ptb\.)?discord(?:app)?\.com\/invite)|(?:discord\.gg(?:\/invite)?))\/)?([A-Za-z0-9-]+)\s*$/;

const logger = module_logger();

export const invite_command = define_command({
	id: ["invite", "inv"],
	track_updates: true,
	options: {
		link: {
			type: OptionType.STRING,
			id: ["link", "l"],
			required: true,
			position: 0
		},
		hide_images: {
			type: OptionType.VOID,
			id: ["hide-images", "hi"]
		}
	},

	pre_run: () => true,
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
				await context.respond(`${icons.error} Invite not found: '${code}'! This could be a friend invite or another type of invite invisible to bots.`);
			else
				await context.respond(`${icons.error} Invite fetch failed: ${format_rest_error(error)}`);

			return;
		}

		const embed: EmbedOptions = { color: Colors.blurple };

		embed.fields = [];


		if (type === InviteTypes.GUILD && guild !== null) {
			embed.author = { name: guild.name };

			const icon_url = guild.iconURL();

			if (icon_url !== null && !args.hide_images)
				embed.author.iconURL = icon_url;

			const banner_url = guild.bannerURL();

			if (banner_url !== null && !args.hide_images)
				embed.image = { url: banner_url };

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
					value: guild.description
				});
			}

			if (channel !== null && channel.name !== null) {
				embed.fields.push({
					name: "Channel",
					value: `${channel.name} (${channel.id})`
				});
			}

			embed.footer = { text: "" };

			if (guild.vanityURLCode !== null)
				embed.footer.text += "discord.gg/" + guild.vanityURLCode + " • ";

			embed.footer.text += guild.id;
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
			const expiry_secs = Math.floor(expiresAt.getTime() / 1000);
			embed.fields.push({
				name: "Expires At",
				value: `<t:${expiry_secs}> (<t:${expiry_secs}:R>)`
			});
		}

		if (inviter !== undefined) {
			embed.fields.push({
				name: "Invited By",
				value: `<@${inviter.id}> (${inviter.tag || inviter.globalName})`
			});
		}

		await context.respond({ embeds: [embed] });
	},
});