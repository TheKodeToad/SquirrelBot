import { createEffect, createResource, on } from "solid-js";
import { getGuilds, GuildResponse } from "../client";
import { account } from "./account";

const [guilds, guildsActions] = createResource(() => account() !== null ? getGuilds(account()!.token) : undefined);
export { guilds };

createEffect(on(account, () => guildsActions.refetch()));

export function useGuild(id: string): GuildResponse | undefined {
	const guildArray = guilds();

	if (guildArray === undefined)
		return undefined;

	if ("error" in guildArray)
		return undefined;

	return guildArray.find(guild => guild.id === id);
}
