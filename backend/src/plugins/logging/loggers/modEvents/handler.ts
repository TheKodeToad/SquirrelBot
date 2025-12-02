import type { SquirrelDiscordContext } from "#discord/index.ts";
import type { LoggerConfig } from "#plugins/logging/config.ts";
import { logEvent } from "#plugins/logging/logEvent.ts";
import { makeModEventView } from "#plugins/logging/loggers/modEvents/views.ts";
import { onModAction } from "#plugins/moderation/public/extensionPoints.ts";
import {
	ModEventType,
	type ModEvent,
} from "#plugins/moderation/public/modEvent.ts";

export default [onModAction(handleModAction)];

async function handleModAction(
	ctx: SquirrelDiscordContext,
	event: ModEvent,
): Promise<void> {
	let key: keyof LoggerConfig["events"];

	switch (event.type) {
		case ModEventType.Ban:
			key = "userBan";
			break;
		case ModEventType.Unban:
			key = "userUnban";
			break;
		case ModEventType.Kick:
			key = "userKick";
			break;
		case ModEventType.Warn:
			key = "userWarn";
			break;
		default:
			return;
	}

	await logEvent(ctx, {
		guild: event.guild,
		key,
		supply: () => makeModEventView(event),
	});
}
