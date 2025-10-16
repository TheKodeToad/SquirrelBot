import { JSX, Match, Resource, Switch } from "solid-js";

export function StatusFallback(props: { children: JSX.Element; resource: Resource<unknown>; }) {
	return (
		<Switch>
			<Match when={props.resource.state === "ready"}>
				{props.children}
			</Match>
			<Match when={props.resource.state === "errored"}>
				{String(props.resource.error)}
			</Match>
			<Match when={props.resource.loading}>
				Please wait...
			</Match>
		</Switch>
	);
}
