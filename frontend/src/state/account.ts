import { createEffect, createSignal, on } from "solid-js";

export interface Account {
	token: string;
	username: string;
	avatar: string;
}

export const [account, set_account] = createSignal<Account | null>(load_from_storage());

export function account_id() {
	const the_account = account();

	if (the_account === null)
		return undefined;

	const split_index = the_account.token.indexOf(".");

	if (split_index === -1)
		return undefined;

	const user_id_part = the_account.token.slice(0, split_index);

	if (user_id_part.length === 0)
		return undefined;

	try {
		var user_id = BigInt("0x" + user_id_part);
	} catch (error) {
		if (!(error instanceof SyntaxError))
			throw error;

		return undefined;
	}

	return user_id;
}

export function avatar_url() {
	const the_account = account();

	if (the_account === null)
		return undefined;

	return `https://cdn.discordapp.com/avatars/${account_id()!}/${the_account.avatar}.png?size=64`;
}

createEffect(on(account, account => localStorage.setItem("account", JSON.stringify(account))));

function load_from_storage(): Account | null {
	const string = localStorage.getItem("account");

	if (string === null)
		return null;

	try {
		return JSON.parse(string);
	} catch (error) {
		if (!(error instanceof SyntaxError))
			throw error;

		console.warn("Could not parse account");
		console.warn(error);

		return null;
	}
}