import { ComponentTypes, type TextDisplayComponent, type User } from "oceanic.js";
import { dateToUnixSeconds } from "../../../../../common/time.ts";
import type { CommandContainerComponent } from "../../../core/public/command.ts";

export function renderFriendInvite(inviter: User, expiresAt: Date | undefined, hideImages: boolean): CommandContainerComponent {
	const result: CommandContainerComponent = {
		components: [],
		type: ComponentTypes.CONTAINER,
	};

	const mainInfo: TextDisplayComponent[] = [];

	mainInfo.push({
		content: "## " + (inviter.username || inviter.globalName) + "\n**Friend Invite**",
		type: ComponentTypes.TEXT_DISPLAY,
	});

	mainInfo.push({
		content: `<@${inviter.id}>`,
		type: ComponentTypes.TEXT_DISPLAY,
	});

	if (hideImages)
		result.components.push(...mainInfo);
	else {
		result.components.push({
			components: mainInfo,
			accessory: { media: { url: inviter.avatarURL() }, type: ComponentTypes.THUMBNAIL },
			type: ComponentTypes.SECTION,
		});
	}

	result.components.push({ type: ComponentTypes.SEPARATOR });

	if (expiresAt !== undefined) {
		const expirySeconds = dateToUnixSeconds(expiresAt);

		result.components.push({
			content: `**Expires At:** <t:${expirySeconds}> (<t:${expirySeconds}:R>)`,
			type: ComponentTypes.TEXT_DISPLAY,
		});
	}

	return result;
}