import { ButtonStyles, ComponentTypes, User, type ContainerComponent, type InviteGuild, type MessageActionRowComponent, type PartialInviteChannel, type TextDisplayComponent } from "oceanic.js";
import { dateToUnixSeconds } from "../../../../../common/time.ts";
import { formatUser } from "../../../../common/discord/format.ts";
import { escapeMarkdown } from "../../../../common/discord/markdown.ts";
import { icons } from "../../../core/public/icons.ts";

export function renderGuildInvite(
	guild: InviteGuild,
	channel: PartialInviteChannel | null,
	inviter: User | undefined,
	onlineMembers: number | undefined,
	totalMembers: number | undefined,
	expiresAt: Date | undefined,
	hideImages: boolean
): ContainerComponent {
	const result: ContainerComponent = {
		components: [],
		type: ComponentTypes.CONTAINER,
	};

	const iconURL = guild.iconURL();
	const bannerURL = guild.bannerURL();
	const splashURL = guild.splashURL();

	const mainInfo: TextDisplayComponent[] = [];

	mainInfo.push({
		content: "## " + escapeMarkdown(guild.name) + "\n**Server Invite**\n" + (guild.description || "*No description provided.*"),
		type: ComponentTypes.TEXT_DISPLAY
	});

	if (totalMembers !== undefined && onlineMembers !== undefined) {
		const online = onlineMembers.toLocaleString("en-US");
		const total = totalMembers.toLocaleString("en-US");

		mainInfo.push({
			type: ComponentTypes.TEXT_DISPLAY,
			content: `${icons.online} ${online} Online  ${icons.offline} ${total} Total`
		});
	}

	if (guild.premiumSubscriptionCount) {
		mainInfo.push({
			type: ComponentTypes.TEXT_DISPLAY,
			content: `${icons.boost} Level ${calculateLevel(guild.premiumSubscriptionCount)} (${guild.premiumSubscriptionCount} Boosts)`
		});
	}

	if (iconURL === null || hideImages)
		result.components.push(...mainInfo);
	else {
		result.components.push({
			type: ComponentTypes.SECTION,
			components: mainInfo,
			accessory: { type: ComponentTypes.THUMBNAIL, media: { url: iconURL } }
		});
	}

	result.components.push({ type: ComponentTypes.SEPARATOR });

	if (inviter !== undefined)
		result.components.push({ content: `**Invited By:** ${formatUser(inviter)}`, type: ComponentTypes.TEXT_DISPLAY });

	if (channel !== null)
		result.components.push({ content: `**Channel:** #${escapeMarkdown(channel.name ?? "<unknown>")} (${channel.id})`, type: ComponentTypes.TEXT_DISPLAY });

	if (expiresAt !== undefined) {
		const expirySeconds = dateToUnixSeconds(expiresAt);

		result.components.push({
			content: `**Expires At:** <t:${expirySeconds}> (<t:${expirySeconds}:R>)`,
			type: ComponentTypes.TEXT_DISPLAY,
		});
	}

	const actions: MessageActionRowComponent[] = [];

	if (iconURL !== null) {
		actions.push(
			{ label: "Icon", type: ComponentTypes.BUTTON, style: ButtonStyles.LINK, url: iconURL }
		);
	}

	if (bannerURL !== null) {
		actions.push(
			{ label: "Banner", type: ComponentTypes.BUTTON, style: ButtonStyles.LINK, url: bannerURL }
		);
	}

	if (splashURL !== null) {
		actions.push(
			{ label: "Splash", type: ComponentTypes.BUTTON, style: ButtonStyles.LINK, url: splashURL }
		);
	}

	if (actions.length !== 0)
		result.components.push({ type: ComponentTypes.ACTION_ROW, components: actions });

	let footer = "-# ";

	if (guild.vanityURLCode !== null)
		footer += escapeMarkdown("discord.gg/" + guild?.vanityURLCode) + " • ";

	footer += "Server ID: " + guild.id;

	result.components.push({
		type: ComponentTypes.TEXT_DISPLAY,
		content: footer,
	});

	return result;
}

export function calculateLevel(boosts: number) {
	if (boosts < 2)
		return 0;
	else if (boosts < 7)
		return 1;
	else if (boosts < 14)
		return 2;
	else
		return 3;
}
