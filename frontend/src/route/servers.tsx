import { createResource, For, Show } from "solid-js";
import { getGuilds, GuildResponse } from "../client";
import { LoginGate } from "../component/login_gate";
import { account } from "../state/account";

export const Servers = () => <LoginGate><ServersComponent /></LoginGate>;

function ServersComponent() {
	const [guilds] = createResource(() => account() !== null ? getGuilds(account()!.token) : undefined);

	return (
		<div class="content">
			<h3>Servers</h3>
			<Show when={!(guilds() === undefined || "error" in guilds()!)}>
				<For each={(guilds() as GuildResponse[])!}>
					{guild => guild.name + "\n"}
				</For>
			</Show>
		</div>
	);
}