import { fetchTextableGuildChannelCached } from "#common/discord/cachedRequest.ts";
import type { Awaitable, ValuesOf } from "#common/general.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import type { LoggerConfig } from "#plugins/logging/config/index.ts";
import { logViaWebhook } from "#plugins/logging/helper/webhooks.ts";
import { loggingConfigStore } from "#plugins/logging/index.ts";
import type { Guild } from "oceanic.js";

type EventConfigs = LoggerConfig["events"];
type EventConfigView<T extends ValuesOf<EventConfigs>> = Parameters<
	Exclude<T, false>["render"]
>[0];

export interface LogEventOptions<T extends keyof EventConfigs> {
	guild: Guild;
	channelID?: string;
	key: T;
	supply: () => Awaitable<EventConfigView<EventConfigs[T]> | null>;
}

export async function logEvent<T extends keyof EventConfigs>(
	ctx: SquirrelDiscordContext,
	options: LogEventOptions<T>,
): Promise<void> {
	const config = loggingConfigStore.get(options.guild.id);

	if (config === undefined) {
		return;
	}

	let view: EventConfigView<EventConfigs[T]> | null = null;

	const tasks: (() => Promise<void>)[] = [];

	for (const logger of config.loggers) {
		const event = logger.events[options.key];

		if (!event) {
			continue;
		}

		if (logger.channel === options.channelID) {
			continue;
		}

		if (view === null) {
			view = await options.supply();

			if (view === null) {
				return;
			}
		}

		tasks.push(async () => {
			const channel = await fetchTextableGuildChannelCached(
				ctx.bot,
				options.guild,
				logger.channel,
			);

			if (channel === null) {
				return;
			}

			await logViaWebhook(ctx, channel, {
				...event.render(view!),
				username: logger.displayName,
				avatarURL:
					logger.avatar ?? options.guild.clientMember.avatarURL(),
			});
		});
	}

	await Promise.all(tasks.map((task) => task()));
}
