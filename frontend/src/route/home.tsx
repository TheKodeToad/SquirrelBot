import { A } from "@solidjs/router";
import { For } from "solid-js";
import { GuildIcon } from "../component/common/GuildIcon";
import { LoginGate } from "../component/LoginGate";
import { CLIENT_ID, INVITE_PERMISSIONS } from "../environment";
import { guilds } from "../state/guilds";

export const Home = () => <LoginGate><GuildsComponent /></LoginGate>;

const INVITE_URL = "https://discord.com/oauth2/authorize?" + new URLSearchParams({
	client_id: CLIENT_ID,
	permissions: INVITE_PERMISSIONS,
	integration_type: "0",
	scope: "bot",
});

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
			<p>
				Server not showing?
				Provided it has been granted access – you may invite <a href={INVITE_URL}>here</a> if
				needed, and ask the owner for permissions.
			</p>
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
