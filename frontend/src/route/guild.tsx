import { A, Route, useLocation, useNavigate, useParams, useResolvedPath } from "@solidjs/router";
import { For, JSX } from "solid-js";
import { Button } from "../component/common/Button";
import { ConfigEditor } from "../component/config/ConfigEditor";
import { PLUGINS, type Plugin } from "../constants";

function getPluginPath(id: string) {
	return "plugins/" + encodeURIComponent(id);
}

export function GuildRoutes() {
	const guildID = () => useParams().guildID!;

	return (
		<Route component={GuildLayout}>
			<Route
				component={() => {
					useNavigate()(getPluginPath("core"));
					return undefined;
				}}
			/>
			<For each={PLUGINS}>
				{plugin => (
					<Route
						path={"/" + getPluginPath(plugin.id)}
						component={() => <ConfigEditor guildID={guildID()} plugin={plugin.id} />}
					/>
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
						{plugin => <PluginSidebarWidget plugin={plugin} />}
					</For>
				</div>
				{props.children}
			</div>
		</>
	);
}

function PluginSidebarWidget(props: { plugin: Plugin; }) {
	const target = useResolvedPath(() => getPluginPath(props.plugin.id));
	const loc = useLocation();
	const active = () => loc.pathname === target() || loc.pathname.startsWith(target() + "/");

	return (
		<A href={getPluginPath(props.plugin.id)}>
			{/* FIXME: using an inline style to get it to look right */}
			<Button color={"transparent2"} active={active()} style={{ width: "100%" }}>
				{props.plugin.name}
			</Button>
		</A>
	);
}
