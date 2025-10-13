import { makeEventExtensionPoint } from "#loader/extensionPoint.ts";
import type { CommittedModAction } from "./modAction.ts";

export const onModAction = makeEventExtensionPoint<CommittedModAction>();
