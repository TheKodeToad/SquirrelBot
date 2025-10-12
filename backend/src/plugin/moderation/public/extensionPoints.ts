import { makeEventExtensionPoint } from "#loader/extensionPoint.ts";
import type { CommitedModAction } from "./modAction.ts";

export const onModAction = makeEventExtensionPoint<CommitedModAction>();
