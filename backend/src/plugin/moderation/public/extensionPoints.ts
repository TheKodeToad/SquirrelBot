import type { SquirrelDiscordContext } from "#discord/index.ts";
import { makeEventExtensionPoint } from "#extensionPoint.ts";
import type { ModEvent } from "./modEvent.ts";

export const onModAction =
	makeEventExtensionPoint<[ctx: SquirrelDiscordContext, event: ModEvent]>();
