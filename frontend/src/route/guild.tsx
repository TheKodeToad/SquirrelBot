import { A, Route, Router, useNavigate, useParams } from "@solidjs/router";
import { createSignal, For, JSX } from "solid-js";
import { PLUGINS, type Plugin } from "../constants";

//export const Guild = () => <LoginGate><GuildComponent /></LoginGate>;

//function testComponent() {
//	return <>hello</>;
//}

function getPluginPath(plugin: Plugin) {
	return "/" + encodeURIComponent(plugin.id);
}

export function GuildRoutes() {
	return (
		<Route component={GuildLayout}>
			<Route
				component={() => {
					useNavigate()("./core");
					return undefined;
				}}
			/>
			<For each={PLUGINS}>
				{plugin => (
					<Route path={getPluginPath(plugin)} component={() => plugin.name} />
				)}
			</For>
		</Route>
	);
}

function GuildLayout(props: { children?: JSX.Element; }) {
	return (
		<>
			<div class="content">
				<div id="sidebar" class="vbox">
					<div class="sidebarHeading">Plugins</div>
					<For each={PLUGINS}>
						{plugin => <PluginWidget plugin={plugin} />}
					</For>
				</div>
				{props.children}
			</div>
		</>
	);
}
function PluginWidget(props: { plugin: Plugin; }) {
	return (
		<A href={"." + getPluginPath(props.plugin)}>
			{props.plugin.name}
		</A>
	);
}

function GuildComponent() {
	const guildID = () => useParams().guildID!;

	const [activeID, setActiveID] = createSignal("core");

	return (
		<Router>
			<Route path="/test" component={() => "test page"} />
			<Route path="/" component={() => "main page"} />
		</Router>
	);
}

