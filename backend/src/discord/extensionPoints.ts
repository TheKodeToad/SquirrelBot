import { makeArrayExtensionPoint } from "#loader/extensionPoint.ts";

export const onBotPreInit = makeArrayExtensionPoint<() => Promise<void> | void>();
export const onBotInit = makeArrayExtensionPoint<() => Promise<void> | void>();
export const onBotPostInit = makeArrayExtensionPoint<() => Promise<void> | void>();
