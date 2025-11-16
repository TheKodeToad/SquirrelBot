import { dbParse, sqlite } from "#storage/index.ts";
import { z } from "zod/v4";

const WebhookAuth = z.strictObject({
	webhookID: z.string(),
	token: z.string(),
});

export interface WebhookAuth extends z.output<typeof WebhookAuth> { }

export function getLoggingWebhook(guildID: string, channelID: string): WebhookAuth | null {
	const result = sqlite.prepare(
		`
			SELECT "webhookID", "token" FROM "logging_webhooks"
			WHERE "guildID" = ? AND "channelID" = ?
		`
	).get(guildID, channelID);

	if (result === undefined)
		return null;

	return dbParse(WebhookAuth, result);
}

export function insertLoggingWebhook(guildID: string, channelID: string, auth: WebhookAuth): boolean {
	const result = sqlite.prepare(
		`
			INSERT INTO "logging_webhooks" ("guildID", "channelID", "webhookID", "token")
			VALUES (?, ?, ?, ?)
		`
	).run(guildID, channelID, auth.webhookID, auth.token);

	return result.changes === 1;
}


export function updateLoggingWebhook(guildID: string, channelID: string, auth: WebhookAuth): boolean {
	const result = sqlite.prepare(
		`
			UPDATE "logging_webhooks"
			SET "webhookID" = ?, "token" = ?
			WHERE "guildID" = ? AND "channelID" = ?
		`
	).run(auth.webhookID, auth.token, guildID, channelID);

	return result.changes === 1;
}
