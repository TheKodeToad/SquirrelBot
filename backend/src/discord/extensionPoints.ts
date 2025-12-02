import type { BackendDiscordContext } from "#discord/discord.ts";
import { makeEventExtensionPoint } from "#extensionPoint.ts";

export const onBotInit =
	makeEventExtensionPoint<[ctx: BackendDiscordContext]>();
