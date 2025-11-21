import { createEffect, createSignal, on } from "solid-js";

export interface Account {
	token: string;
	username: string;
	avatar: string;
}

export const [account, setAccount] = createSignal<Account | null>(loadFromStorage());

export function useAccountID() {
	const theAccount = account();

	if (theAccount === null) {
		return undefined;
	}

	const splitIndex = theAccount.token.indexOf(".");

	if (splitIndex === -1) {
		return undefined;
	}

	const userIDPart = theAccount.token.slice(0, splitIndex);

	if (userIDPart.length === 0) {
		return undefined;
	}

	try {
		var userID = BigInt("0x" + userIDPart);
	} catch (error) {
		if (!(error instanceof SyntaxError)) {
			throw error;
		}

		return undefined;
	}

	return userID;
}

export function useAvatarURL() {
	const theAccount = account();

	if (theAccount === null) {
		return undefined;
	}

	return `https://cdn.discordapp.com/avatars/${useAccountID()!}/${theAccount.avatar}.png?size=64`;
}

createEffect(on(account, account => localStorage.setItem("account", JSON.stringify(account))));

addEventListener("storage", event => {
	if (event.key === "account") {
		setAccount(loadFromStorage());
	}
});

function loadFromStorage(): Account | null {
	const string = localStorage.getItem("account");

	if (string === null) {
		return null;
	}

	try {
		return JSON.parse(string);
	} catch (error) {
		if (!(error instanceof SyntaxError)) {
			throw error;
		}

		console.warn("Could not parse account");
		console.warn(error);

		return null;
	}
}
