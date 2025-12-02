import { makeMemberUserView, makeUserView } from "#common/views/user.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { onBotEvent } from "#plugins/core/public/extensionPoints.ts";
import { logEvent } from "#plugins/logging/helper/logging.ts";
import { loggingConfigStore } from "#plugins/logging/index.ts";
import { Guild, Member, type Uncached, type User } from "oceanic.js";

export default [
	onBotEvent({ type: "guildMemberAdd", listener: handleAdd }),
	onBotEvent({ type: "guildMemberRemove", listener: handleRemove }),
];

async function handleAdd(
	ctx: SquirrelDiscordContext,
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
	ctx: SquirrelDiscordContext,
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
