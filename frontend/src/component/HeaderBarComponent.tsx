import { A, useMatch } from "@solidjs/router";
import { IconChevronRight, IconLogin, IconLogout, IconSettings } from "@tabler/icons-solidjs";
import { Match, Switch } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { logIn, logOut } from "../authFlow";
import { account, avatarURL } from "../state/account";
import { Button } from "./common/Button";

export function HeaderBarComponent({ children }: { children?: JSX.Element; }) {
	const guildMatch = useMatch(() => "/guilds/:guildID/*?");

	const breadcrumbChildren = () => {
		const guildID = guildMatch()?.params.guildID;

		if (guildID !== undefined) {
			return (
				<>
					<IconChevronRight size="1em" />
					<A href={`/guilds/${guildID}`}>Guild</A>
				</>
			);
		}

		return undefined;
	};

	return (<>
		<nav id="headerBar" class="hbox">
			<span id="headerBar-breadcrumb"><A href="/">SquirrelBot</A>{breadcrumbChildren()}</span>
			<Switch>
				<Match when={account() === null}>
					<Button onClick={logIn} color="primary" icon={IconLogin} style={{ "margin-left": "auto" }}>
						Log In
					</Button>
				</Match>
				<Match when={account() !== null}>
					<Button onClick={() => logOut()} color="transparent" style={{ "margin-left": "auto" }}>
						<img src={avatarURL()} class="avatar" /> {account()?.username} <IconLogout size="1em" />
					</Button>
				</Match>
			</Switch>
			<Button color="transparent" icon={IconSettings}>
				Preferences
			</Button>
		</nav>

		{children}
	</>);
};
