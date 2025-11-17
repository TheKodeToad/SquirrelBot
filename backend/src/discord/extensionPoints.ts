import type { DiscordContext } from "#discord/index.ts";
import { makeEventExtensionPoint } from "#loader/extensionPoint.ts";

export const onBotInit = makeEventExtensionPoint<[ctx: DiscordContext]>();
