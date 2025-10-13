import { makeMemberUserView, makeUserView } from "#common/template/user.ts";
import { onBotEvent } from "#plugin/core/public/extensionPoints.ts";
import { logEvent } from "#plugin/logging/helper/logging.ts";
import { loggingConfigStore } from "#plugin/logging/index.ts";
import { Guild, Member, type Uncached, type User } from "oceanic.js";

export default [
	onBotEvent({ type: "guildMemberAdd", listener: handleAdd }),
	onBotEvent({ type: "guildMemberRemove", listener: handleRemove }),
];

async function handleAdd(member: Member): Promise<void> {
	await logEvent(member.guild, null, "member_join", () => ({
		user: makeMemberUserView(member)
	}));
}

async function handleRemove(user: Member | User, guild: Guild | Uncached): Promise<void> {
	if (!(guild instanceof Guild))
		return;

	const config = loggingConfigStore.get(guild.id);

	if (config === undefined)
		return;

	await logEvent(guild, null, "member_leave", () => ({
		user: "guildID" in user ? makeMemberUserView(user) : makeUserView(user)
	}));
}

