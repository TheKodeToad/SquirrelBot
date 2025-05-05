import { A } from "@solidjs/router";
import { For } from "solid-js";
import { GuildIcon } from "../component/common/GuildIcon";
import { LoginGate } from "../component/LoginGate";
import { APP_INVITE_PERMISSIONS, CLIENT_ID } from "../constants";
import { guilds } from "../state/guilds";

export const Home = () => <LoginGate><GuildsComponent /></LoginGate>;

const INVITE_URL = "https://discord.com/oauth2/authorize?" + new URLSearchParams({
	client_id: CLIENT_ID,
	permissions: APP_INVITE_PERMISSIONS,
	integration_type: "0",
	scope: "bot",
});

function GuildsComponent() {
	const guildsChildren = () => {
		const guildList = guilds();

		if (guildList === undefined)
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

function GuildCard(props: { name: string; id: string; iconHash: string | null; }) {
	return (
		<A href={`/guilds/${props.id}`} class="guildCard">
			<GuildIcon id={props.id} iconHash={props.iconHash} size={64} />
			<span class="guildCard-title">{props.name}</span>
		</A>
	);
}
