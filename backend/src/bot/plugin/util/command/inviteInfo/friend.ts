import { type TextDisplayComponent, type User } from "oceanic.js";
import { dateToUnixSeconds } from "../../../../../common/time.ts";
import { Container, Section, Separator, Text, Thumbnail } from "../../../core/helper/componentSugar.ts";
import type { CommandContainerComponent } from "../../../core/public/command.ts";

export function renderFriendInvite(inviter: User, expiresAt: Date | undefined, hideImages: boolean): CommandContainerComponent {
	const result = Container();

	const mainInfo: TextDisplayComponent[] = [];

	mainInfo.push(Text("## " + (inviter.username || inviter.globalName || "<unknown>") + "\n**Friend Invite**"));
	mainInfo.push(Text(`<@${inviter.id}>`));

	if (hideImages)
		result.components.push(...mainInfo);
	else
		result.components.push(Section(mainInfo, Thumbnail(inviter.avatarURL())));

	result.components.push(Separator());

	if (expiresAt !== undefined) {
		const expirySeconds = dateToUnixSeconds(expiresAt);

		result.components.push(Text(`**Expires At:** <t:${expirySeconds}> (<t:${expirySeconds}:R>)`));
	}

	return result;
}
