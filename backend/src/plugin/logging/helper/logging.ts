import { fetchTextableGuildChannelCached } from "#common/discord/cachedRequest.ts";
import type { Awaitable, ValuesOf } from "#common/general.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import type { LoggerConfig } from "#plugin/logging/config/index.ts";
import { logViaWebhook } from "#plugin/logging/helper/webhooks.ts";
import { loggingConfigStore } from "#plugin/logging/index.ts";
import type { Guild } from "oceanic.js";

type EventConfig = ValuesOf<LoggerConfig["events"]>;
type EventConfigView<T extends EventConfig> = Parameters<
	Exclude<T, false>["render"]
>[0];

export async function logEvent<T extends EventConfig>(
	ctx: SquirrelDiscordContext,
	guild: Guild,
	channel: string | null,
	key: keyof LoggerConfig["events"],
	supply: () => Awaitable<EventConfigView<T> | null>,
): Promise<void> {
	const config = loggingConfigStore.get(guild.id);

	if (config === undefined) {
		return;
	}

	let lazyParams: EventConfigView<T> | undefined;

	const tasks: (() => Promise<void>)[] = [];

	for (const logger of config.loggers) {
		const event = logger.events[key];

		if (!event) {
			continue;
		}

		if (logger.channel === channel) {
			continue;
		}

		if (lazyParams === undefined) {
			const view = await supply();

			if (view === null) {
				return;
			}

			tasks.push(async () => {
				const channel = await fetchTextableGuildChannelCached(
					ctx.bot,
					guild,
					logger.channel,
				);

				if (channel === null) {
					return;
				}

				await logViaWebhook(ctx, channel, {
					...event.render(view),
					username: logger.displayName,
					avatarURL: logger.avatar ?? guild.clientMember.avatarURL(),
				});
			});
		}
	}

	await Promise.all(tasks.map((task) => task()));
}
