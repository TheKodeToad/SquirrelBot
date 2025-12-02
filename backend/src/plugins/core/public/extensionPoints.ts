import type { Awaitable } from "#common/general.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { makeMapExtensionPoint } from "#extensionPoint.ts";
import type { Contribution, Plugin } from "#plugin.ts";
import type { Command, Option } from "#plugins/core/public/command.ts";
import type { ConfigStore } from "#plugins/core/public/configStore.ts";
import type { ClientEvents } from "oceanic.js";

// custom implementations as fancy stuff with generics is required

export interface BotEventListener<T extends keyof ClientEvents = any> {
	type: T;
	listener: (
		ctx: SquirrelDiscordContext,
		...args: ClientEvents[T]
	) => Awaitable<void>;
}

export function onBotEvent<T extends keyof ClientEvents>(
	listener: BotEventListener<T>,
): Contribution {
	return (_) => onBotEvent.contributions.push(listener);
}

onBotEvent.contributions = [] as BotEventListener[];

export function defineCommand<
	TOpts extends Record<string, Option> = Record<string, Option>,
	TData extends {} = {},
>(command: Command<TOpts, TData>): Contribution {
	return (plugin) => defineCommand.contributions.push([plugin, command]);
}

defineCommand.contributions = [] as [Plugin, Command][];

export interface Config {
	store: ConfigStore;
	defaultValue: string;
}

export const defineConfig = makeMapExtensionPoint<Config>("defineConfig");
