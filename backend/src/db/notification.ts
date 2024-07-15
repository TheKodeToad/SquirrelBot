import { PoolClient } from "pg";
import { pool } from ".";

let listener_client: PoolClient | null = null;
const listeners_lookup: Map<string, Listener[]> = new Map;

export type Listener = (payload: string | undefined) => void | Promise<void>;

export async function connect_listener(): Promise<void> {
	listener_client = await pool.connect();
	await listener_client.query(
		`
			CREATE FUNCTION pg_temp.listen(channel TEXT) RETURNS VOID
			AS $$ BEGIN EXECUTE format('LISTEN %I', channel); END $$
			LANGUAGE plpgsql
		`
	);
	listener_client.on("notification", notification => {
		const listeners = listeners_lookup.get(notification.channel);

		if (listeners === undefined)
			return;

		listeners.forEach(listener => listener(notification.payload));
	});
}

export async function add_channel_listener(channel: string, listener: Listener): Promise<void> {
	if (listener_client === null)
		throw new Error("connect_listener() not called");

	let listeners = listeners_lookup.get(channel);

	if (listeners === undefined) {
		await listener_client.query("SELECT pg_temp.listen($1)", [channel]);
		listeners_lookup.set(channel, [listener]);
	} else
		listeners.push(listener);
}

export async function notify_channel(channel: string, payload: string): Promise<void> {
	await pool.query("SELECT pg_notify($1, $2)", [channel, payload]);
}
