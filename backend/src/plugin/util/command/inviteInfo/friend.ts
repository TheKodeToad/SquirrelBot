import { formatUserTagRich } from "#common/discord/format.ts";
import { dateToUnixSecs } from "#common/time.ts";
import { Container, Divider, Section, Text, Thumbnail } from "oceanic-component-helper";
import { type ContainerComponent, type User } from "oceanic.js";

export function renderFriendInvite(inviter: User, expiresAt: Date | undefined, hideImages: boolean): ContainerComponent {
	const result = Container();

	const mainInfo: string[] = [];

	mainInfo.push("## " + formatUserTagRich(inviter) + "\n**Friend Invite**");
	mainInfo.push(`<@${inviter.id}>`);

	if (hideImages)
		result.components.push(...mainInfo.map(content => Text(content)));
	else
		result.components.push(Section(mainInfo, Thumbnail(inviter.avatarURL())));

	result.components.push(Divider());

	if (expiresAt !== undefined) {
		const expirySeconds = dateToUnixSecs(expiresAt);

		result.components.push(Text(`**Expires At:** <t:${expirySeconds}> (<t:${expirySeconds}:R>)`));
	}

	return result;
}
