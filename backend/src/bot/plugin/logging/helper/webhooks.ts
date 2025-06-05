import { isThreadChannel } from "#bot/common/discord/general.ts";
import { bot } from "#bot/index.ts";
import { getLoggingWebhook, insertLoggingWebhook, updateLoggingWebhook, type WebhookAuth } from "#db/logger/webhooks.ts";
import AsyncLock from "async-lock";
import { DiscordRESTError, JSONErrorCodes, Permissions, type AnyTextableGuildChannel, type ExecuteWebhookOptions } from "oceanic.js";

export async function logToChannel(channel: AnyTextableGuildChannel, message: ExecuteWebhookOptions): Promise<void> {
	return acquireWebhook(channel, async ({ webhookID, token }) => {
		if (isThreadChannel(channel))
			message.threadID = channel.id;

		await bot.rest.webhooks.execute(webhookID, token, {
			username: (bot.user.globalName ?? bot.user.username) + " Logging",
			avatarURL: bot.user.avatarURL(),
			...message,
		});
	});
}

const webhookLock = new AsyncLock();

async function acquireWebhook(channel: AnyTextableGuildChannel, action: (auth: WebhookAuth) => Promise<void>): Promise<void> {
	return webhookLock.acquire(channel.id, async () => {
		const baseChannel = isThreadChannel(channel) ? channel.parent : channel;

		const existingWebhook = await getLoggingWebhook(channel.guildID, channel.id);

		if (existingWebhook !== null) {
			try {
				await action(existingWebhook);
				return;
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				if (error.code !== JSONErrorCodes.UNKNOWN_WEBHOOK)
					throw error;

				// try to create it again
			}
		}

		if (baseChannel === undefined)
			throw new Error("Uncached thread parent channel");

		if (!baseChannel.permissionsOf(channel.guild.clientMember).has(Permissions.MANAGE_WEBHOOKS))
			return;

		const webhook = await baseChannel.createWebhook({ name: "Squirrel Logging Webhook" });
		const auth: WebhookAuth = { webhookID: webhook.id, token: webhook.token! };

		if (existingWebhook !== null)
			await updateLoggingWebhook(channel.guildID, channel.id, auth);
		else
			await insertLoggingWebhook(channel.guildID, channel.id, auth);

		await action(auth);
	});
}
