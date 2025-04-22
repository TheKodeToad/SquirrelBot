import { createResource, For, Show } from "solid-js";
import { getGuilds, GuildResponse } from "../client";
import { LoginGate } from "../component/LoginGate";
import { account } from "../state/account";

export const Servers = () => <LoginGate><ServersComponent /></LoginGate>;

function ServersComponent() {
	const [guilds] = createResource(() => account() !== null ? getGuilds(account()!.token) : undefined);

	return (
		<div class="content">
			<h1>Servers</h1>
			<Show when={!(guilds() === undefined || "error" in guilds()!)}>
				<For each={(guilds() as GuildResponse[])!}>
					{guild => guild.name + "\n"}
				</For>
			</Show>
		</div>
	);
}