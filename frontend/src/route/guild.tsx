import { useParams } from "@solidjs/router";
import { ConfigEditor } from "../component/config/ConfigEditor";
import { LoginGate } from "../component/LoginGate";

export const Guild = () => <LoginGate><GuildComponent /></LoginGate>;

export function GuildComponent() {
	const guildID = () => useParams().guildID!;

	return (
		<div><ConfigEditor guildID={guildID()} configKey="core" /></div>
	);
}
