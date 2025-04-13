import type { PoolClient } from "pg";
import { pool } from "./index.ts";

let listenerClient: PoolClient | null = null;
const listenersLookup: Map<string, Listener[]> = new Map;

export type Listener = (payload: string | undefined) => void | Promise<void>;

export async function connectChannelListener(): Promise<void> {
	listenerClient = await pool.connect();
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

export function disconnectChannelListener() {
	listenerClient?.release();
}

export async function addChannelListener(channel: string, listener: Listener): Promise<void> {
	if (listenerClient === null)
		throw new Error("connectListener() not called");

	let listeners = listenersLookup.get(channel);

	if (listeners === undefined) {
		await listenerClient.query("SELECT pg_temp.listen($1)", [channel]);
		listenersLookup.set(channel, [listener]);
	} else
		listeners.push(listener);
}

export async function notifyChannel(channel: string, payload: string): Promise<void> {
	await pool.query("SELECT pg_notify($1, $2)", [channel, payload]);
}
