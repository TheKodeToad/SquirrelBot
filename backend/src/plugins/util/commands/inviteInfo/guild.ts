import { formatUser } from "#common/discord/formatting.ts";
import { escapeMarkdown } from "#common/discord/markdown.ts";
import { dateToUnixSecs } from "#common/time.ts";
import { icons } from "#plugins/core/public/icons.ts";
import {
	ActionRow,
	Container,
	Divider,
	Section,
	Text,
	Thumbnail,
	URLButton,
} from "oceanic-component-helper";
import {
	User,
	type ContainerComponent,
	type InviteGuild,
	type MessageActionRowComponent,
	type PartialInviteChannel,
} from "oceanic.js";

export function renderGuildInvite(
	guild: InviteGuild,
	channel: PartialInviteChannel | null,
	inviter: User | undefined,
	onlineMembers: number | undefined,
	totalMembers: number | undefined,
	expiresAt: Date | undefined,
	hideImages: boolean,
): ContainerComponent {
	const result = Container();

	const iconURL = guild.iconURL();
	const bannerURL = guild.bannerURL();
	const splashURL = guild.splashURL();

	const mainInfo: string[] = [];

	mainInfo.push(
		"## " +
			escapeMarkdown(guild.name) +
			"\n**Server Invite**\n" +
			(guild.description || "*No description provided.*"),
	);

	if (totalMembers !== undefined && onlineMembers !== undefined) {
		const online = onlineMembers.toLocaleString("en-US");
		const total = totalMembers.toLocaleString("en-US");

		mainInfo.push(
			`${icons.online} ${online} Online  ${icons.offline} ${total} Total`,
		);
	}

	if (guild.premiumSubscriptionCount) {
		const level = calculateLevel(guild.premiumSubscriptionCount);
		mainInfo.push(
			`${icons.boost} Level ${level} (${guild.premiumSubscriptionCount} Boosts)`,
		);
	}

	if (iconURL === null || hideImages) {
		result.components.push(...mainInfo.map((content) => Text(content)));
	} else {
		result.components.push(Section(mainInfo, Thumbnail(iconURL)));
	}

	result.components.push(Divider());

	let fields = "";

	if (inviter !== undefined) {
		fields += `**Invited By:** ${formatUser(inviter)}\n`;
	}

	if (channel !== null) {
		fields += `**Channel:** #${escapeMarkdown(channel.name ?? "<unknown>")} (${channel.id})\n`;
	}

	result.components.push(Text(fields));

	if (expiresAt !== undefined) {
		const expirySeconds = dateToUnixSecs(expiresAt);
		result.components.push(
			Text(
				`**Expires At:** <t:${expirySeconds}> (<t:${expirySeconds}:R>)`,
			),
		);
	}

	const actions = ActionRow<MessageActionRowComponent>();

	if (iconURL !== null) {
		actions.components.push(URLButton("Icon", iconURL));
	}

	if (bannerURL !== null) {
		actions.components.push(URLButton("Banner", bannerURL));
	}

	if (splashURL !== null) {
		actions.components.push(URLButton("Splash", splashURL));
	}

	if (actions.components.length !== 0) {
		result.components.push(actions);
	}

	let footer = "-# ";

	if (guild.vanityURLCode !== null) {
		footer += escapeMarkdown("discord.gg/" + guild?.vanityURLCode) + " • ";
	}

	footer += "Server ID: " + guild.id;

	result.components.push(Text(footer));

	return result;
}

export function calculateLevel(boosts: number): number {
	if (boosts < 2) {
		return 0;
	} else if (boosts < 7) {
		return 1;
	} else if (boosts < 14) {
		return 2;
	} else {
		return 3;
	}
}
