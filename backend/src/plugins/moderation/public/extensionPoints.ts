import type { BackendDiscordContext } from "#discord/discord.ts";
import { makeEventExtensionPoint } from "#extensionPoint.ts";
import type { ModEvent } from "./modEvent.ts";

export const onModAction =
	makeEventExtensionPoint<[ctx: BackendDiscordContext, event: ModEvent]>();
