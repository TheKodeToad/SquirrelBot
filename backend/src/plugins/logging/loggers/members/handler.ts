import { makeMemberUserView, makeUserView } from "#common/views/user.ts";
import type { BackendDiscordContext } from "#discord/discord.ts";
import { onBotEvent } from "#plugins/core/public/extensionPoints.ts";
import { logEvent } from "#plugins/logging/logEvent.ts";
import { loggingConfigStore } from "#plugins/logging/plugin.ts";
import { Guild, Member, type Uncached, type User } from "oceanic.js";

export default [
	onBotEvent({ type: "guildMemberAdd", listener: handleAdd }),
	onBotEvent({ type: "guildMemberRemove", listener: handleRemove }),
];

async function handleAdd(
	ctx: BackendDiscordContext,
	member: Member,
): Promise<void> {
	await logEvent(ctx, {
		guild: member.guild,
		key: "memberJoin",
		supply: () => ({
			user: makeMemberUserView(member),
		}),
	});
}

async function handleRemove(
	ctx: BackendDiscordContext,
	user: Member | User,
	guild: Guild | Uncached,
): Promise<void> {
	if (!(guild instanceof Guild)) {
		return;
	}

	const config = loggingConfigStore.get(guild.id);

	if (config === undefined) {
		return;
	}

	await logEvent(ctx, {
		guild,
		key: "memberLeave",
		supply: () => ({
			user:
				"guildID" in user ?
					makeMemberUserView(user)
				:	makeUserView(user),
		}),
	});
}
