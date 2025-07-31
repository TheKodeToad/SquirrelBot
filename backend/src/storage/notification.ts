import type { Awaitable } from "#common/general.ts";
import { postgres } from "#storage/index.ts";
import type { PoolClient } from "pg";

let listenerClient: PoolClient | null = null;
const listenersLookup: Map<string, Listener[]> = new Map;

export type Listener = (payload: string | undefined) => Awaitable<void>;

export async function connectChannelListener(): Promise<void> {
	listenerClient = await postgres.connect();
	await listenerClient.query(
		`
			CREATE FUNCTION pg_temp.listen(channel TEXT) RETURNS VOID
			AS $$ BEGIN EXECUTE format('LISTEN %I', channel); END $$
			LANGUAGE plpgsql
		`
	);
	listenerClient.on("notification", notification => {
		const listeners = listenersLookup.get(notification.channel);

		if (listeners === undefined)
			return;

		listeners.forEach(listener => listener(notification.payload));
	});
}

export function disconnectChannelListener(): void {
	listenerClient?.release();
}

export async function addChannelListener(channel: string, listener: Listener): Promise<void> {
	if (listenerClient === null)
		throw new Error("connectListener() not called");

	const listeners = listenersLookup.get(channel);

	if (listeners === undefined) {
		await listenerClient.query("SELECT pg_temp.listen($1)", [channel]);
		listenersLookup.set(channel, [listener]);
	} else
		listeners.push(listener);
}

export async function notifyChannel(channel: string, payload: string): Promise<void> {
	await postgres.query("SELECT pg_notify($1, $2)", [channel, payload]);
}
