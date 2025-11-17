import type { DiscordContext } from "#discord/index.ts";
import { makeEventExtensionPoint } from "#loader/extensionPoint.ts";
import type { ModEvent } from "./modEvent.ts";

export const onModAction = makeEventExtensionPoint<[ctx: DiscordContext, event: ModEvent]>();
