import { log_in as request_log_in, log_out as request_log_out } from "./client";

import { build_uri } from "./common/uri";
import { CLIENT_ID, REDIRECT_URI } from "./environment";
import { account, set_account } from "./state/account";

let auth_window: WindowProxy | null = null;

window.addEventListener("beforeunload", () => auth_window?.close());
window.addEventListener("message", async event => {
	if (!(event.source === auth_window && event.origin === location.origin)) {
		console.warn("Message from unknown window @ " + event.origin);
		return;
	}

	const { code } = event.data;

	if (typeof code !== "string") {
		console.warn("Malformed data object:");
		console.warn(event.data);
		return;
	}

	await login_callback(code);
});

export function log_in() {
	if (!(auth_window === null || auth_window.closed)) {
		auth_window.focus();
		return;
	}

	const login_uri = build_uri`https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=identify&prompt=none`;

	const width = 1000;
	const height = 800;
	const left = screen.width / 2 - width / 2;
	const top = screen.height / 2 - height / 2;

	auth_window = open(login_uri, undefined, `popup=true,width=${width},height=${height},left=${left},top=${top}`);

	if (auth_window === null)
		location.href = login_uri;
}

async function login_callback(code: string) {
	const response = await request_log_in(code);

	if ("error" in response)
		return; // TODO handle errors

	set_account({
		token: response.token,
		username: response.username,
		avatar: response.avatar
	});
}

export async function log_out() {
	const token = account()?.token;

	if (token === undefined) {
		console.warn("Tried to log out when there was no account");
		return;
	}

	set_account(null);
	await request_log_out(token);
}
