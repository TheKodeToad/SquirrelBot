import { createResource, Match } from "solid-js";
import { baseExtensions } from ".";
import { getGuildConfig } from "../../client";
import { account } from "../../state/account";
import { useGuild } from "../../state/guilds";
import { CodeMirror } from "../common/CodeMirror";
import { Switch } from "solid-js";

export function ConfigEditor(props: { guildID: string; plugin: string; }) {
	const guild = () => useGuild(props.guildID);

	const [resource] = createResource(() => [guild(), props.plugin], () => {
		if (guild() !== undefined)
			return getGuildConfig(account()!.token, guild()!.id, props.plugin);
		else
			return undefined;
	});

	return (
		<Switch fallback="Please wait...">
			<Match when={resource.state === "ready"}>
				<CodeMirror value={resource()!} extensions={baseExtensions} />
			</Match>
			<Match when={resource.state === "errored"}>
				{String(resource.error)}
			</Match>
		</Switch>
	);
}
