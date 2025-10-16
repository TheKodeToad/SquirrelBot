import { createResource } from "solid-js";
import { baseExtensions } from ".";
import { getGuildConfig } from "../../client";
import { account } from "../../state/account";
import { useGuild } from "../../state/guilds";
import { CodeMirror } from "../common/CodeMirror";
import { StatusFallback } from "../common/StatusFallback";

export function ConfigEditor(props: { guildID: string; plugin: string; }) {
	const guild = () => useGuild(props.guildID);

	const [resource] = createResource(() => [guild(), props.plugin], () => {
		if (guild() !== undefined)
			return getGuildConfig(account()!.token, guild()!.id, props.plugin);
		else
			return undefined;
	});

	return (
		<StatusFallback resource={resource}>
			<CodeMirror value={resource()!} extensions={baseExtensions} />
		</StatusFallback>
	);
}
