import { createResource } from "solid-js";
import { getGuilds, GuildResponse } from "../client";
import { account } from "./account";

export const [guilds] = createResource(account, account => account !== null ? getGuilds(account.token) : undefined);

export function useGuild(id: string): GuildResponse | undefined {
	const guildArray = guilds();

	if (guildArray === undefined)
		return undefined;

	return guildArray.find(guild => guild.id === id);
}
