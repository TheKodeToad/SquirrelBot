import { createSignal } from "solid-js";
import { logIn as requestLogIn, logOut as requestLogOut } from "./client";
import { Uint8Array_toBase64 } from "./common/polyfill";
import { CLIENT_ID, REDIRECT_URI } from "./constants";
import { account, setAccount } from "./state/account";

export async function logIn(): Promise<void> {
	const buffer = new Uint8Array(64);
	crypto.getRandomValues(buffer);

	const verifier = Uint8Array_toBase64(buffer, { alphabet: "base64url", omitPadding: true });

	const verifierHash = new Uint8Array(await crypto.subtle.digest("sha-256", new TextEncoder().encode(verifier)));
	const challenge = Uint8Array_toBase64(verifierHash, { alphabet: "base64url", omitPadding: true });

	sessionStorage.setItem("authVerifier", verifier);

	const url = `https://discord.com/oauth2/authorize?` + new URLSearchParams({
		client_id: CLIENT_ID,
		response_type: "code",
		redirect_uri: REDIRECT_URI,
		scope: "identify",
		prompt: "none",
		code_challenge: challenge,
		code_challenge_method: "S256",
		state: window.location.pathname + window.location.search + window.location.hash
	});

	window.location.assign(url);
}

export type CallbackStatus = { state: "working" } | { state: "errored", error: unknown };

const [callbackStatus, setCallbackStatus] = createSignal<CallbackStatus | null>(null);

export const loginCallbackStatus = callbackStatus;

export async function handleLoginCallback() {
	if (window.location.pathname !== "/log-in")
		return;

	const params = new URLSearchParams(window.location.search);

	const code = params.get("code");

	if (code === null)
		throw new Error("Missing code in URL");

	const state = params.get("state");

	if (state !== null)
		history.replaceState(null, "", state);

	const verifier = sessionStorage.getItem("authVerifier");
	sessionStorage.removeItem("authVerifier");

	if (verifier === null)
		throw new Error("Login was not initiated in the same session");

	setCallbackStatus({ state: "working" });

	try {
		const response = await requestLogIn(code, verifier)
		setAccount({
			token: response.token,
			username: response.username,
			avatar: response.avatar
		});
		setCallbackStatus(null);
	} catch (error) {
		console.error("Login failure:", error);
		setCallbackStatus({ state: "errored", error });
	}
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
