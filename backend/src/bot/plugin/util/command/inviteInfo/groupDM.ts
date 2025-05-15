import { formatUser } from "#bot/common/discord/format.ts";
import { getChannelIconURL } from "#bot/common/discord/urls.ts";
import { icons } from "#bot/plugin/core/public/icons.ts";
import { dateToUnixSeconds } from "#common/time.ts";
import { ActionRow, Container, Divider, Section, Text, Thumbnail, URLButton } from "oceanic-component-helper";
import { type ContainerComponent, type PartialInviteChannel, type User } from "oceanic.js";

export function renderGroupDMInvite(
	channel: PartialInviteChannel,
	inviter: User | undefined,
	totalMembers: number | undefined,
	expiresAt: Date | undefined,
	hideImages: boolean
): ContainerComponent {
	const result = Container();

	const mainInfo: string[] = [];

	mainInfo.push("## " + (channel.name ?? "<unknown>") + "\n**Group Invite**");

	if (totalMembers !== undefined) {
		const total = totalMembers.toLocaleString("en-US");
		mainInfo.push(`${icons.online} ${total} Members`);
	}

	const iconURL: string | null = getChannelIconURL(channel);

	if (iconURL === null || hideImages) {
		result.components.push(...mainInfo.map(content => Text(content)));
	} else
		result.components.push(Section(mainInfo, Thumbnail(iconURL)));

	result.components.push(Divider());

	if (inviter !== undefined)
		result.components.push(Text("**Invited By:** " + formatUser(inviter)));

	if (expiresAt !== undefined) {
		const expirySeconds = dateToUnixSeconds(expiresAt);

		result.components.push(Text(`**Expires At:** <t:${expirySeconds}> (<t:${expirySeconds}:R>)`));
	}

	if (iconURL !== null) {
		result.components.push(ActionRow([URLButton("Icon", iconURL)]));
	}

	result.components.push(Text("-# Group Channel ID: " + channel.id));

	return result;
}
