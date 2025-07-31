import { onBotEvent } from "#plugin/core/public/extensionPoints.ts";
import { logEvent } from "#plugin/logging/helper/logging.ts";
import { loggingConfigStore } from "#plugin/logging/index.ts";
import { Guild, Member, type Uncached, type User } from "oceanic.js";

export default [
	onBotEvent({ type: "guildMemberAdd", listener: handleAdd }),
	onBotEvent({ type: "guildMemberRemove", listener: handleRemove }),
];

async function handleAdd(member: Member): Promise<void> {
	await logEvent(
		member.guild,
		null,
		events => events.member_join,
		() => {
			return {
				user: member,
				user_avatar: member.avatarURL(),
				user_created_at: member.createdAt,
				user_age: Date.now() - member.createdAt.getTime(),
			};
		}
	);
}

async function handleRemove(user: Member | User, guild: Guild | Uncached): Promise<void> {
	if (!(guild instanceof Guild))
		return;

	const config = loggingConfigStore.get(guild.id);

	if (config === undefined)
		return;


	await logEvent(
		guild,
		null,
		events => events.member_leave,
		() => {
			return {
				user: user,
				user_avatar: user.avatarURL(),
				user_created_at: user.createdAt,
				user_age: Date.now() - user.createdAt.getTime(),
				user_joined_at: (user instanceof Member && user.joinedAt) || undefined,
				user_stay_duration: (
					user instanceof Member
					&& user.joinedAt
					&& Date.now() - user.joinedAt.getTime()
				) || undefined,
			};
		}
	);
}

