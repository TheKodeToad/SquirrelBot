import { makeMapExtensionPoint } from "#loader/extensionPoint.ts";
import type { ConfigStore } from "#plugin/core/discord/public/configStore.ts";

export interface Config {
	store: ConfigStore;
	defaultValue: string;
}

export const defineConfig = makeMapExtensionPoint<Config>("defineConfig");
