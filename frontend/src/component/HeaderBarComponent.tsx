import { A, useMatch } from "@solidjs/router";
import {
	IconChevronRight,
	IconLogout,
	IconSettings,
} from "@tabler/icons-solidjs";
import { Match, Show, Switch } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { logOut } from "../auth";
import { account, Account, useAvatarURL } from "../state/account";
import { guilds, useGuild } from "../state/guilds";
import { Button } from "./common/Button";
import { GuildIcon } from "./common/GuildIcon";

export function HeaderBarComponent(props: { children?: JSX.Element }) {
	const guildMatch = useMatch(() => "/guilds/:guildID/*?");

	const breadcrumbChildren = () => {
		const guildID = guildMatch()?.params.guildID;

		if (guildID !== undefined) {
			const guild = useGuild(guildID);

			return (
				<>
					<IconChevronRight size="1em" />
					<GuildIcon
						id={guildID}
						iconHash={guild?.iconHash ?? null}
						size={24}
					/>
					<A href={`/guilds/${guildID}`}>
						<Switch>
							<Match when={guild !== undefined}>
								{guild!.name}
							</Match>
							<Match when={guilds.loading}>Loading</Match>
							<Match when={true}>Unknown</Match>
						</Switch>
					</A>
				</>
			);
		}

		return undefined;
	};

	return (
		<>
			<nav id="headerBar" class="hbox">
				<span id="headerBar-breadcrumb">
					<A href="/" end={true}>
						Dashboard
					</A>
					{breadcrumbChildren()}
				</span>
				<span style={{ "margin-left": "auto" }} />
				<Show when={account() !== null}>
					<AccountButton account={account()!} />
				</Show>
				<Button color="transparent3" icon={IconSettings}>
					Preferences
				</Button>
			</nav>

			{props.children}
		</>
	);
}
function AccountButton(props: { account: Account }) {
	return (
		<Button onClick={() => logOut()} color="transparent3">
			<img src={useAvatarURL()} class="avatar" />{" "}
			{props.account!.username} <IconLogout size="1em" />
		</Button>
	);
}
