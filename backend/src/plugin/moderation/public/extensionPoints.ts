import { makeEventExtensionPoint } from "#loader/extensionPoint.ts";
import type { ModEvent } from "./modEvent.ts";

export const onModAction = makeEventExtensionPoint<ModEvent>();
