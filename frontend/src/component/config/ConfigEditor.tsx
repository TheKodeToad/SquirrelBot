import { createResource } from "solid-js";
import { baseExtensions } from ".";
import { getGuildConfig } from "../../client";
import { account } from "../../state/account";
import { useGuild } from "../../state/guilds";
import { CodeMirror } from "../common/CodeMirror";

export function ConfigEditor(props: { guildID: string; configKey: string; }) {
	const guild = () => useGuild(props.guildID);

	const [resource] = createResource(() => guild(), () => {
		if (guild() !== undefined)
			return getGuildConfig(account()!.token, guild()!.id, "moderation");
		else
			return undefined;
	});

	return <CodeMirror value={resource() ?? ""} extensions={baseExtensions} />;
}
