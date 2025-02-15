import { IconArrowRight } from "@tabler/icons-solidjs";
import { JSX, Show } from "solid-js";
import { log_in } from "../auth_flow";
import { account } from "../state/account";
import { Button } from "./common/button";

export function LoginGate({ children }: { children: JSX.Element; }) {
	return (
		<Show when={account() !== null} fallback={
			<div class="vbox not_found">
				<h1 style={{ margin: 0 }}>Login Required</h1>
				<p>Please authorize with Discord.</p>
				<Button onClick={log_in} color="primary" icon={IconArrowRight}>
					Continue
				</Button>
			</div>
		}>
			{children}
		</Show>
	);
}