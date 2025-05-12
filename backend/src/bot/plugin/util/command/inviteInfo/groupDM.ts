import { type PartialInviteChannel, type TextDisplayComponent, type User } from "oceanic.js";
import { dateToUnixSeconds } from "../../../../../common/time.ts";
import { formatUser } from "../../../../common/discord/format.ts";
import { getChannelIconURL } from "../../../../common/discord/urls.ts";
import { ActionRow, Container, LinkButton, Section, Separator, Text, Thumbnail } from "../../../core/helper/componentSugar.ts";
import type { CommandContainerComponent } from "../../../core/public/command.ts";
import { icons } from "../../../core/public/icons.ts";

export function renderGroupDMInvite(
	channel: PartialInviteChannel,
	inviter: User | undefined,
	totalMembers: number | undefined,
	expiresAt: Date | undefined,
	hideImages: boolean
): CommandContainerComponent {
	const result = Container();

	const mainInfo: TextDisplayComponent[] = [];

	mainInfo.push(Text("## " + (channel.name ?? "<unknown>") + "\n**Group Invite**"));

	if (totalMembers !== undefined) {
		const total = totalMembers.toLocaleString("en-US");
		mainInfo.push(Text(`${icons.online} ${total} Members`));
	}

	const iconURL: string | null = getChannelIconURL(channel);

	if (iconURL === null || hideImages) {
		result.components.push(...mainInfo);
	} else
		result.components.push(Section(mainInfo, Thumbnail(iconURL)));

	result.components.push(Separator());

	if (inviter !== undefined)
		result.components.push(Text("**Invited By:** " + formatUser(inviter)));

	if (expiresAt !== undefined) {
		const expirySeconds = dateToUnixSeconds(expiresAt);

		result.components.push(Text(`**Expires At:** <t:${expirySeconds}> (<t:${expirySeconds}:R>)`));
	}

	if (iconURL !== null) {
		result.components.push(ActionRow([LinkButton("Icon", iconURL)]));
	}

	result.components.push(Text("-# Group Channel ID: " + channel.id));

	return result;
}
