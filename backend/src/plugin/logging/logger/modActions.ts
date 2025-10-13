import type { Awaitable } from "#common/general.ts";
import { onModAction } from "#plugin/moderation/public/extensionPoints.ts";
import type { CommittedModAction } from "#plugin/moderation/public/modAction.ts";

export default [
	onModAction(handleModAction)
];

function handleModAction(action: CommittedModAction): Awaitable<void> {
	// TODO: the stuff
}
