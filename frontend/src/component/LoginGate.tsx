import { A } from "@solidjs/router";
import { IconArrowRight } from "@tabler/icons-solidjs";
import { JSX, Show } from "solid-js";
import { LOGIN_URL } from "../helper/auth";
import { account } from "../state/account";
import { Button } from "./common/Button";

export function LoginGate({ children }: { children: JSX.Element; }) {
	return (
		<Show when={account() !== null} fallback={
			<div class="vbox loginGate">
				<h1 style={{ margin: 0 }}>Login Required</h1>
				<p>Please authorize with Discord.</p>
				<A href={LOGIN_URL}>
					<Button color="primary" icon={IconArrowRight}>
						Continue
					</Button>
				</A>
			</div>
		}>
			{children}
		</Show>
	);
}
