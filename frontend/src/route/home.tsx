import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { GuildResponse } from "../client";
import { GuildIcon } from "../component/common/GuildIcon";
import { LoginGate } from "../component/LoginGate";
import { guilds } from "../state/guilds";

export const Home = () => <LoginGate><GuildsComponent /></LoginGate>;

function GuildsComponent() {
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

function GuildCard({ name, id, iconHash }: { name: string; id: string; iconHash: string | null; }) {
	return (
		<A href={`/guilds/${id}`} class="guildCard">
			<GuildIcon id={id} iconHash={iconHash} size={64} />
			<span class="guildCard-title">{name}</span>
		</A>
	);
}