import { ButtonStyles, ComponentTypes, type ContainerComponent, type PartialInviteChannel, type TextDisplayComponent, type User } from "oceanic.js";
import { dateToUnixSeconds } from "../../../../../common/time.ts";
import { formatUser } from "../../../../common/discord/format.ts";
import { getChannelIconURL } from "../../../../common/discord/urls.ts";
import { icons } from "../../../core/public/icons.ts";

export function renderGroupDMInvite(
	channel: PartialInviteChannel,
	inviter: User | undefined,
	totalMembers: number | undefined,
	expiresAt: Date | undefined,
	hideImages: boolean
): ContainerComponent {
	const result: ContainerComponent = {
		components: [],
		type: ComponentTypes.CONTAINER,
	};

	const mainInfo: TextDisplayComponent[] = [];

	mainInfo.push({ content: "## " + channel.name + "\n**Group Invite**", type: ComponentTypes.TEXT_DISPLAY });

	if (totalMembers !== undefined) {
		const total = totalMembers.toLocaleString("en-US");
		mainInfo.push({ content: `${icons.online} ${total} Members`, type: ComponentTypes.TEXT_DISPLAY });
	}

	const iconURL: string | null = getChannelIconURL(channel);

	if (iconURL === null || hideImages) {
		result.components.push(...mainInfo);
	} else {
		result.components.push({
			components: mainInfo,
			accessory: { media: { url: iconURL }, type: ComponentTypes.THUMBNAIL },
			type: ComponentTypes.SECTION,
		});
	}

	result.components.push({ type: ComponentTypes.SEPARATOR });

	if (inviter !== undefined)
		result.components.push({ content: "**Invited By:** " + formatUser(inviter), type: ComponentTypes.TEXT_DISPLAY });

	if (expiresAt !== undefined) {
		const expirySeconds = dateToUnixSeconds(expiresAt);

		result.components.push({
			content: `**Expires At:** <t:${expirySeconds}> (<t:${expirySeconds}:R>)`,
			type: ComponentTypes.TEXT_DISPLAY,
		});
	}

	if (iconURL !== null) {
		result.components.push({
			type: ComponentTypes.ACTION_ROW,
			components: [{ label: "Icon", url: iconURL, type: ComponentTypes.BUTTON, style: ButtonStyles.LINK }]
		});
	}

	result.components.push({
		content: "-# Group Channel ID: " + channel.id,
		type: ComponentTypes.TEXT_DISPLAY,
	});

	return result;
}