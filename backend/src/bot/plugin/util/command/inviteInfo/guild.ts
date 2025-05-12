import { User, type InviteGuild, type PartialInviteChannel, type TextDisplayComponent } from "oceanic.js";
import { dateToUnixSeconds } from "../../../../../common/time.ts";
import { formatUser } from "../../../../common/discord/format.ts";
import { escapeMarkdown } from "../../../../common/discord/markdown.ts";
import { ActionRow, Container, LinkButton, Section, Separator, Text, Thumbnail } from "../../../core/helper/componentSugar.ts";
import type { CommandContainerComponent } from "../../../core/public/command.ts";
import { icons } from "../../../core/public/icons.ts";

export function renderGuildInvite(
	guild: InviteGuild,
	channel: PartialInviteChannel | null,
	inviter: User | undefined,
	onlineMembers: number | undefined,
	totalMembers: number | undefined,
	expiresAt: Date | undefined,
	hideImages: boolean
): CommandContainerComponent {
	const result = Container();

	const iconURL = guild.iconURL();
	const bannerURL = guild.bannerURL();
	const splashURL = guild.splashURL();

	const mainInfo: TextDisplayComponent[] = [];

	mainInfo.push(Text("## " + escapeMarkdown(guild.name) + "\n**Server Invite**\n" + (guild.description || "*No description provided.*")));

	if (totalMembers !== undefined && onlineMembers !== undefined) {
		const online = onlineMembers.toLocaleString("en-US");
		const total = totalMembers.toLocaleString("en-US");

		mainInfo.push(Text(`${icons.online} ${online} Online  ${icons.offline} ${total} Total`));
	}

	if (guild.premiumSubscriptionCount) {
		const level = calculateLevel(guild.premiumSubscriptionCount);
		mainInfo.push(Text(`${icons.boost} Level ${level} (${guild.premiumSubscriptionCount} Boosts)`));
	}

	if (iconURL === null || hideImages)
		result.components.push(...mainInfo);
	else
		result.components.push(Section(mainInfo, Thumbnail(iconURL)));

	result.components.push(Separator());

	let fields = "";

	if (inviter !== undefined)
		fields += `**Invited By:** ${formatUser(inviter)}\n`;

	if (channel !== null)
		fields += `**Channel:** #${escapeMarkdown(channel.name ?? "<unknown>")} (${channel.id})\n`;

	result.components.push(Text(fields));

	if (expiresAt !== undefined) {
		const expirySeconds = dateToUnixSeconds(expiresAt);
		result.components.push(Text(`**Expires At:** <t:${expirySeconds}> (<t:${expirySeconds}:R>)`));
	}

	const actions = ActionRow();

	if (iconURL !== null)
		actions.components.push(LinkButton("Icon", iconURL));

	if (bannerURL !== null)
		actions.components.push(LinkButton("Banner", bannerURL));

	if (splashURL !== null)
		actions.components.push(LinkButton("Splash", splashURL));

	if (actions.components.length !== 0)
		result.components.push(actions);

	let footer = "-# ";

	if (guild.vanityURLCode !== null)
		footer += escapeMarkdown("discord.gg/" + guild?.vanityURLCode) + " • ";

	footer += "Server ID: " + guild.id;

	result.components.push(Text(footer));

	return result;
}

export function calculateLevel(boosts: number): number {
	if (boosts < 2)
		return 0;
	else if (boosts < 7)
		return 1;
	else if (boosts < 14)
		return 2;
	else
		return 3;
}
