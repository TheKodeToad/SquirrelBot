import { A } from "@solidjs/router";
import { For } from "solid-js";
import { GuildIcon } from "../component/common/GuildIcon";
import { StatusFallback } from "../component/common/StatusFallback";
import { LoginGate } from "../component/LoginGate";
import { APP_INVITE_PERMISSIONS, CLIENT_ID } from "../constants";
import { guilds } from "../state/guilds";

export const Home = () => (
	<LoginGate>
		<GuildsComponent />
	</LoginGate>
);

const INVITE_URL =
	"https://discord.com/oauth2/authorize?"
	+ new URLSearchParams({
		client_id: CLIENT_ID,
		permissions: APP_INVITE_PERMISSIONS,
		integration_type: "0",
		scope: "bot",
	});

function GuildsComponent() {
	return (
		<div class="content">
			<div class="mainContent">
				<h1>Servers</h1>
				<p>
					Server not showing? <a href={INVITE_URL}>Add the app</a> if
					needed, and ask the owner for permissions.
				</p>
				<div class={"guilds"}>
					<StatusFallback resource={guilds}>
						<For each={guilds()}>
							{(guild) => <GuildCard {...guild} />}
						</For>
					</StatusFallback>
				</div>
			</div>
		</div>
	);
}

function GuildCard(props: {
	name: string;
	id: string;
	iconHash: string | null;
}) {
	return (
		<A href={`/guilds/${props.id}`} class="guildCard">
			<GuildIcon id={props.id} iconHash={props.iconHash} size={64} />
			<span class="guildCard-title">{props.name}</span>
		</A>
	);
}
