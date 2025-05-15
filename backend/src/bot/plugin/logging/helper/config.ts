import type { EventConfigSchema as EventConfig } from "#schema/plugin/logging.ts";

export function isEventConfigEnabled(event: EventConfig): boolean {
	return event === true || typeof event === "object";
}
