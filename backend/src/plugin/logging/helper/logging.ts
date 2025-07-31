import { fetchTextableGuildChannelCached } from "#common/discord/cachedRequest.ts";
import type { Awaitable, ValuesOf } from "#common/general.ts";
import type { ParameterRecord, TemplateSchema } from "#common/template/index.ts";
import type { LoggerConfig } from "#plugin/logging/config/index.ts";
import { logViaWebhook } from "#plugin/logging/helper/webhooks.ts";
import { loggingConfigStore } from "#plugin/logging/index.ts";
import type { Guild } from "oceanic.js";

export async function logEvent<S extends TemplateSchema>(
	guild: Guild,
	channel: string | null,
	select: (events: LoggerConfig["events"]) => ValuesOf<LoggerConfig["events"]>,
	supply: () => Awaitable<ParameterRecord<S> | null>,
): Promise<void> {
	const config = loggingConfigStore.get(guild.id);

	if (config === undefined)
		return;

	let lazyParams: ParameterRecord<S> | undefined;

	const tasks: (() => Promise<void>)[] = [];

	for (const logger of config.loggers) {
		const event = select(logger.events);

		if (!event)
			continue;

		if (logger.channel === channel)
			continue;

		if (lazyParams === undefined) {
			const params = await supply();

			if (params === null)
				return;

			tasks.push(async () => {
				const channel = await fetchTextableGuildChannelCached(guild, logger.channel);

				if (channel === null)
					return;

				await logViaWebhook(channel, {
					...event.apply(params),
					username: logger.displayName,
					avatarURL: logger.avatar ?? guild.clientMember.avatarURL(),
				});
			});
		}
	}

	await Promise.all(tasks.map(task => task()));
}
