import { useParams } from "@solidjs/router";
import { ConfigEditor } from "../component/config/ConfigEditor";
import { LoginGate } from "../component/LoginGate";

export const Guild = () => <LoginGate><GuildComponent /></LoginGate>;

export function GuildComponent() {
	const guildID = () => useParams().guildID!;

	return (
		<div class="content"><ConfigEditor guildID={guildID()} plugin="core" /></div>
	);
}
