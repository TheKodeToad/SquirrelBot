import { APP_NAME } from "#brand.ts";
import { isThreadChannel } from "#common/discord/general.ts";
import type { Awaitable } from "#common/general.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { getLoggingWebhook, insertLoggingWebhook, updateLoggingWebhook, type WebhookAuth } from "#plugin/logging/storage/webhooks.ts";
import AsyncLock from "async-lock";
import { DiscordRESTError, JSONErrorCodes, Permissions, type AnyTextableGuildChannel, type ExecuteWebhookOptions } from "oceanic.js";

export async function logViaWebhook(ctx: SquirrelDiscordContext, channel: AnyTextableGuildChannel, message: ExecuteWebhookOptions): Promise<void> {
	return acquireWebhook(ctx, channel, async ({ webhookID, token }) => {
		if (isThreadChannel(channel)) {
			message.threadID = channel.id;
		}

		await channel.client.rest.webhooks.execute(webhookID, token, message);
	});
}

const webhookLock = new AsyncLock();

async function acquireWebhook(ctx: SquirrelDiscordContext, channel: AnyTextableGuildChannel, action: (auth: WebhookAuth) => Awaitable<void>): Promise<void> {
	return webhookLock.acquire(channel.id, async () => {
		const baseChannel = isThreadChannel(channel) ? channel.parent : channel;

		const existingWebhook = await getLoggingWebhook(ctx.db, channel.guildID, channel.id);

		if (existingWebhook !== null) {
			try {
				await action(existingWebhook);
				return;
			} catch (error) {
				if (!(error instanceof DiscordRESTError)) {
					throw error;
				}

				if (error.code !== JSONErrorCodes.UNKNOWN_WEBHOOK) {
					throw error;
				}

				// try to create it again
			}
		}

		if (baseChannel === undefined) {
			throw new Error("Uncached thread parent channel");
		}

		if (!baseChannel.permissionsOf(channel.guild.clientMember).has(Permissions.MANAGE_WEBHOOKS)) {
			return;
		}

		const webhook = await baseChannel.createWebhook({ name: APP_NAME + " Logging Webhook" });
		const auth: WebhookAuth = { webhookID: webhook.id, token: webhook.token! };

		if (existingWebhook !== null) {
			await updateLoggingWebhook(ctx.db, channel.guildID, channel.id, auth);
		} else {
			await insertLoggingWebhook(ctx.db, channel.guildID, channel.id, auth);
		}

		await action(auth);
	});
}
