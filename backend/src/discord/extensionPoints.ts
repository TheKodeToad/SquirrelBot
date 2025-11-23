import type { SquirrelDiscordContext } from "#discord/index.ts";
import { makeEventExtensionPoint } from "#extensionPoint.ts";

export const onBotInit =
	makeEventExtensionPoint<[ctx: SquirrelDiscordContext]>();
