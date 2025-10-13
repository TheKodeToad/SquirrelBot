import type { Awaitable } from "#common/general.ts";
import { onModAction } from "#plugin/moderation/public/extensionPoints.ts";
import type { ModEvent } from "#plugin/moderation/public/modEvent.ts";

export default [
	onModAction(handleModAction)
];

function handleModAction(action: ModEvent): Awaitable<void> {
	// TODO: the stuff
}
