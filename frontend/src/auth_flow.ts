import { logIn as requestLogIn, logOut as requestLogOut } from "./client";

import { buildURI } from "./common/uri";
import { CLIENT_ID, REDIRECT_URI } from "./environment";
import { account, setAccount } from "./state/account";

let authWindow: WindowProxy | null = null;

window.addEventListener("beforeunload", () => authWindow?.close());
window.addEventListener("message", async event => {
	if (!(event.source === authWindow && event.origin === location.origin)) {
		console.warn("Message from unknown window @ " + event.origin);
		return;
	}

	const { code } = event.data;

	if (typeof code !== "string") {
		console.warn("Malformed data object:");
		console.warn(event.data);
		return;
	}

	await loginCallback(code);
});

export function logIn() {
	if (!(authWindow === null || authWindow.closed)) {
		authWindow.focus();
		return;
	}

	const login_uri = buildURI`https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=identify&prompt=none`;

	const width = 1000;
	const height = 800;
	const left = screen.width / 2 - width / 2;
	const top = screen.height / 2 - height / 2;

	authWindow = open(login_uri, undefined, `popup=true,width=${width},height=${height},left=${left},top=${top}`);

	if (authWindow === null)
		location.href = login_uri;
}

async function loginCallback(code: string) {
	const response = await requestLogIn(code);

	if ("error" in response)
		return; // TODO handle errors

	setAccount({
		token: response.token,
		username: response.username,
		avatar: response.avatar
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
