import { A } from "@solidjs/router";
import { createResource, For, Show } from "solid-js";
import { getGuilds, GuildResponse } from "../client";
import { LoginGate } from "../component/LoginGate";
import { account } from "../state/account";

export const Servers = () => <LoginGate><GuildsComponent /></LoginGate>;

function GuildsComponent() {
	const [guilds] = createResource(() => account() !== null ? getGuilds(account()!.token) : undefined);

	return (
		<div class="content mainContent">
			<h1>Servers</h1>
			<Show when={!(guilds() === undefined || "error" in guilds()!)}>
				<div class={"guilds"}>
					<For each={guilds() as GuildResponse[]}>
						{guild => <GuildCard {...guild} />}
					</For>
				</div>
			</Show>
		</div>
	);
}

function GuildCard({ name, iconHash, id }: { name: string; iconHash: string | null; id: string; }) {
	const icon =
		iconHash !== null
			? `https://cdn.discordapp.com/icons/${id}/${iconHash}.png?size=256`
			: "https://cdn.discordapp.com/embed/avatars/0.png";

	return (
		<A href={`/servers/${id}`} class="guildCard">
			<img src={icon} />
			<span class="guildCard-title">{name}</span>
		</A>
	);
}