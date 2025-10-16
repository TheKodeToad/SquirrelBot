import { A, useMatch } from "@solidjs/router";
import { IconChevronRight, IconLogin, IconLogout, IconSettings } from "@tabler/icons-solidjs";
import { Match, Show, Switch } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { APP_NAME } from "../constants";
import { logIn, logOut } from "../auth";
import { account, Account, useAvatarURL } from "../state/account";
import { useGuild } from "../state/guilds";
import { Button } from "./common/Button";
import { GuildIcon } from "./common/GuildIcon";

export function HeaderBarComponent(props: { children?: JSX.Element; }) {
	const guildMatch = useMatch(() => "/guilds/:guildID/*?");

	const breadcrumbChildren = () => {
		const guildID = guildMatch()?.params.guildID;

		if (guildID !== undefined) {
			const guild = useGuild(guildID);

			return (
				<>
					<IconChevronRight size="1em" />
					<Show when={guild !== undefined}>
						<GuildIcon id={guild!.id} iconHash={guild!.iconHash} size={24} />
					</Show>
					<A href={`/guilds/${guildID}`}>{guild?.name ?? "<unknown>"}</A>
				</>
			);
		}

		return undefined;
	};

	return (
		<>
			<nav id="headerBar" class="hbox">
				<span id="headerBar-breadcrumb"><A href="/">{APP_NAME} Dashboard</A>{breadcrumbChildren()}</span>
				<AccountButton account={account()} />
				<Button color="transparent" icon={IconSettings}>
					Preferences
				</Button>
			</nav>

			{props.children}
		</>
	);
};
function AccountButton(props: { account: Account | null; }) {
	return (
		<Switch>
			<Match when={props.account === null}>
				<Button onClick={logIn} color="primary" icon={IconLogin} style={{ "margin-left": "auto" }}>
					Log In
				</Button>
			</Match>
			<Match when={props.account !== null}>
				<Button onClick={() => logOut()} color="transparent" style={{ "margin-left": "auto" }}>
					<img src={useAvatarURL()} class="avatar" /> {props.account!.username} <IconLogout size="1em" />
				</Button>
			</Match>
		</Switch>
	);
}

