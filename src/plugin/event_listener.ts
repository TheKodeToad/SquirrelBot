import { ClientEvents } from "oceanic.js";

export interface EventListener<E extends keyof ClientEvents = keyof ClientEvents> {
	type: E;
	listener(...args: ClientEvents[E]): Promise<void> | void;
}

export function define_event_listener<E extends keyof ClientEvents>(type: E, listener: EventListener<E>["listener"]): EventListener<E> {
	return { type, listener };
}
