import type { EventConfig } from "#plugin/logging/config.ts";

export function isEventConfigEnabled(event: EventConfig): boolean {
	return event === true || typeof event === "object";
}
