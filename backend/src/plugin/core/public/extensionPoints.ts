import type { Awaitable } from "#common/general.ts";
import { makeMapExtensionPoint, type Contribution } from "#loader/extensionPoint.ts";
import type { Plugin } from "#loader/plugin.ts";
import type { Command, Option } from "#plugin/core/public/command.ts";
import type { ConfigStore } from "#plugin/core/public/configStore.ts";
import type { ClientEvents } from "oceanic.js";

// custom implementations as fancy stuff with generics is required

export interface BotEventListener<T extends keyof ClientEvents = any> {
	type: T;
	listener: (...args: ClientEvents[T]) => Awaitable<void>;
}

export function onBotEvent<T extends keyof ClientEvents>(listener: BotEventListener<T>): Contribution {
	return _ => onBotEvent.contributions.push(listener);
}

onBotEvent.contributions = [] as BotEventListener[];

export function defineCommand<O extends Record<string, Option> = Record<string, Option>, D extends {} = {}>(command: Command<O, D>): Contribution {
	return plugin => defineCommand.contributions.push([plugin, command]);
}

defineCommand.contributions = [] as [Plugin, Command][];

export interface Config {
	store: ConfigStore;
	defaultValue: string;
}

export const defineConfig = makeMapExtensionPoint<Config>("defineConfig");
