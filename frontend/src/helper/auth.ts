import { logIn as requestLogIn, logOut as requestLogOut } from "../client";

import { CLIENT_ID, REDIRECT_URI } from "../environment";
import { account, setAccount } from "../state/account";

export const LOGIN_URL = `https://discord.com/oauth2/authorize?` + new URLSearchParams({
	client_id: CLIENT_ID,
	response_type: "code",
	redirect_uri: REDIRECT_URI,
	scope: "identify",
	prompt: "none"
});

export function handleLoginCallback() {
	if (location.pathname !== "/log-in")
		return;

	const params = new URLSearchParams(location.search);
	const code = params.get("code");

	if (code === null)
		return;

	history.replaceState(null, "", "/");

	requestLogIn(code).then(response => {
		if ("error" in response)
			return; // TODO handle errors

		setAccount({
			token: response.token,
			username: response.username,
			avatar: response.avatar
		});
	});
}

export async function logOut() {
	const token = account()?.token;

	if (token === undefined) {
		console.warn("Tried to log out when there was no account");
		return;
	}

	setAccount(null);
	await requestLogOut(token);
}
