import { IconArrowBackUp, IconLogin } from "@tabler/icons-solidjs";
import { JSX, Match, Switch } from "solid-js";
import { logIn, loginCallbackStatus } from "../auth";
import { account } from "../state/account";
import { Button } from "./common/Button";

export function LoginGate(props: { children: JSX.Element }) {
	const Status = (props: { children: JSX.Element }) => (
		<div class="vbox loginGate">{props.children}</div>
	);

	return (
		<Switch>
			<Match when={account() !== null}>{props.children}</Match>
			<Match when={loginCallbackStatus() === null}>
				<Status>
					<h1 style={{ margin: 0 }}>Login Required</h1>
					<p>You must log in to proceed to the dashboard.</p>
					<Button onClick={logIn} color="primary" icon={IconLogin}>
						Log in with Discord
					</Button>
				</Status>
			</Match>
			<Match when={loginCallbackStatus()!.state === "working"}>
				<Status>
					<h1 style={{ margin: 0 }}>Logging in...</h1>
					<p>Waiting for a response.</p>
				</Status>
			</Match>
			<Match when={loginCallbackStatus()!.state === "errored"}>
				<Status>
					<h1 style={{ margin: 0 }}>Login Failed</h1>
					<p>{String((loginCallbackStatus() as any).error)}</p>
					<Button
						onClick={logIn}
						color="primary"
						icon={IconArrowBackUp}
					>
						Try Again
					</Button>
				</Status>
			</Match>
		</Switch>
	);
}
