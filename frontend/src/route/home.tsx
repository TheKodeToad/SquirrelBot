import { A } from "@solidjs/router";
import { For } from "solid-js";
import { GuildIcon } from "../component/common/GuildIcon";
import { LoginGate } from "../component/LoginGate";
import { guilds } from "../state/guilds";

export const Home = () => <LoginGate><GuildsComponent /></LoginGate>;

function GuildsComponent() {
	const guildsChildren = () => {
		const guildList = guilds();

		if (guildList === undefined)
			return;

		if ("error" in guildList)
			return;

		return (
			<For each={guildList}>
				{guild => <GuildCard {...guild} />}
			</For>
		);
	};

	return (
		<div class="content mainContent">
			<h1>Servers</h1>
			<div class={"guilds"}>
				{guildsChildren()}
			</div>
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
