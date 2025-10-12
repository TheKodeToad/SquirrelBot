import { makeEventExtensionPoint } from "#loader/extensionPoint.ts";
import type { ModActionSuccess } from "./modAction.ts";

export const onModAction = makeEventExtensionPoint<ModActionSuccess>();
