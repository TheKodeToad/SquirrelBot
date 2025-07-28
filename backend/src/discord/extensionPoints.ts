import { makeEventExtensionPoint } from "#loader/extensionPoint.ts";

export const onBotInit = makeEventExtensionPoint<void>();
