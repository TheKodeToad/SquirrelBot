import type { Awaitable } from "#common/general.ts";
import type { Pool } from "pg";

export type Listener = (payload: string | undefined) => Awaitable<void>;

export interface NotifDispatcher {
	addListener(channel: string, listener: Listener): Promise<void>;
	disconnect(): void;
}

export async function connectNotifDispatcher(pool: Pool): Promise<NotifDispatcher> {
	const client = await pool.connect();
	const listenersLookup: Map<string, Listener[]> = new Map;

	await client.query(
		`
			CREATE FUNCTION pg_temp.listen(channel TEXT) RETURNS VOID
			AS $$ BEGIN EXECUTE format('LISTEN %I', channel); END $$
			LANGUAGE plpgsql
		`
	);
	client.on("notification", notification => {
		const listeners = listenersLookup.get(notification.channel);

		if (listeners === undefined) {
			return;
		}

		listeners.forEach(listener => listener(notification.payload));
	});

	return {
		async addListener(channel, listener) {
			const listeners = listenersLookup.get(channel);

			if (listeners === undefined) {
				await client.query("SELECT pg_temp.listen($1)", [channel]);
				listenersLookup.set(channel, [listener]);
			} else {
				listeners.push(listener);
			}
		},
		disconnect: client.release
	};
}

export async function notifyChannel(pool: Pool, channel: string, payload: string): Promise<void> {
	await pool.query("SELECT pg_notify($1, $2)", [channel, payload]);
}
