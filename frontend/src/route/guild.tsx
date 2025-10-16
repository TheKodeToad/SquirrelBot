import { useParams } from "@solidjs/router";
import { ConfigEditor } from "../component/config/ConfigEditor";
import { LoginGate } from "../component/LoginGate";
import { PLUGINS, type Plugin } from "../constants";
import { Button } from "../component/common/Button";
import { createSignal, For } from "solid-js";

export const Guild = () => <LoginGate><GuildComponent /></LoginGate>;

export function GuildComponent() {
	const guildID = () => useParams().guildID!;

	const [activeID, setActiveID] = createSignal("core");

	return (
		<div class="content">
			<div id="sidebar" class="vbox">
				<h2 style={{ margin: 0 }}>Plugins</h2>
				<For each={PLUGINS}>
					{plugin => (
						<PluginWidget
							plugin={plugin}
							active={activeID() === plugin.id}
							activate={() => setActiveID(plugin.id)}
						/>
					)}
				</For>
			</div>
			<ConfigEditor guildID={guildID()} plugin={activeID()} />
		</div>
	);
}

export function PluginWidget(props: { plugin: Plugin; active: boolean; activate: () => void; }) {
	return (
		<Button color="transparent" active={props.active} onClick={() => props.activate()}>
			{props.plugin.name}
		</Button>
	);
}
