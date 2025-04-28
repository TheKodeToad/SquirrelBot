import { A, useMatch } from "@solidjs/router";
import { IconChevronRight, IconLogin, IconLogout, IconSettings } from "@tabler/icons-solidjs";
import { Match, Show, Switch } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { LOGIN_URL, logOut } from "../helper/auth";
import { account, useAvatarURL } from "../state/account";
import { useGuild } from "../state/guilds";
import { Button } from "./common/Button";
import { GuildIcon } from "./common/GuildIcon";

export function HeaderBarComponent({ children }: { children?: JSX.Element; }) {
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

	return (<>
		<nav id="headerBar" class="hbox">
			<span id="headerBar-breadcrumb"><A href="/">SquirrelBot Dashboard</A>{breadcrumbChildren()}</span>
			<Switch>
				<Match when={account() === null}>
					<A href={LOGIN_URL} style={{ "margin-left": "auto" }}>
						<Button color="primary" icon={IconLogin}>
							Log In
						</Button>
					</A>
				</Match>
				<Match when={account() !== null}>
					<Button onClick={() => logOut()} color="transparent" style={{ "margin-left": "auto" }}>
						<img src={useAvatarURL()} class="avatar" /> {account()?.username} <IconLogout size="1em" />
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
