import { IconLogin, IconLogout, IconSettings } from "@tabler/icons-solidjs";
import { Match, Switch } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { log_in, log_out } from "../auth_flow";
import { account, avatar_url } from "../state/account";
import { Button } from "./common/button";

export function HeaderBarComponent({ children }: { children?: JSX.Element; }) {
	return (
		<>
			<nav id="header_bar" class="hbox">
				SquirrelBot
				<Switch>
					<Match when={account() === null}>
						<Button onClick={log_in} color="primary" icon={IconLogin} style={{ "margin-left": "auto" }}>
							Log In
						</Button>
					</Match>
					<Match when={account() !== null}>
						<Button onClick={() => log_out()} color="transparent" style={{ "margin-left": "auto" }}>
							<img src={avatar_url()} class="avatar" /> {account()?.username} <IconLogout size="1em" />
						</Button>
					</Match>
				</Switch>
				<Button color="transparent" icon={IconSettings}>
					Settings
				</Button>
			</nav>

			{children}
		</>
	);
};;;
