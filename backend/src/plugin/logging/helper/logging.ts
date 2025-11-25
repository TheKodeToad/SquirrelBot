import { fetchTextableGuildChannelCached } from "#common/discord/cachedRequest.ts";
import type { Awaitable, ValuesOf } from "#common/general.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import type { LoggerConfig } from "#plugin/logging/config/index.ts";
import { logViaWebhook } from "#plugin/logging/helper/webhooks.ts";
import { loggingConfigStore } from "#plugin/logging/index.ts";
import type { Guild } from "oceanic.js";

type EventConfigs = LoggerConfig["events"];
type EventConfigView<T extends ValuesOf<EventConfigs>> = Parameters<
	Exclude<T, false>["render"]
>[0];

export async function logEvent<T extends keyof EventConfigs>(
	ctx: SquirrelDiscordContext,
	guild: Guild,
	channel: string | null,
	key: T,
	supply: () => Awaitable<EventConfigView<EventConfigs[T]> | null>,
): Promise<void> {
	const config = loggingConfigStore.get(guild.id);

	if (config === undefined) {
		return;
	}

	let view: EventConfigView<EventConfigs[T]> | null = null;

	const tasks: (() => Promise<void>)[] = [];

	for (const logger of config.loggers) {
		const event = logger.events[key];

		if (!event) {
			continue;
		}

		if (logger.channel === channel) {
			continue;
		}

		if (view === null) {
			view = await supply();

			if (view === null) {
				return;
			}
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
				...event.render(view!),
				username: logger.displayName,
				avatarURL: logger.avatar ?? guild.clientMember.avatarURL(),
			});
		});
	}

	await Promise.all(tasks.map((task) => task()));
}
