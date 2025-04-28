import { useParams } from "@solidjs/router";
import { LoginGate } from "../component/LoginGate";
import { useGuild } from "../state/guilds";

export const Guild = () => <LoginGate><GuildComponent /></LoginGate>;

export function GuildComponent() {
	const guildID = () => useParams().guildID!;

	return <span>{useGuild(guildID())?.name} - {guildID()}</span>;
}
