import { dbParse } from "#storage/index.ts";
import type { Pool } from "pg";
import { z } from "zod/v4";

const WebhookAuth = z.strictObject({
	webhookID: z.string(),
	token: z.string(),
});

export interface WebhookAuth extends z.output<typeof WebhookAuth> {}

export async function getLoggingWebhook(
	db: Pool,
	guildID: string,
	channelID: string,
): Promise<WebhookAuth | null> {
	const result = await db.query(
		`
			SELECT "webhookID", "token" FROM "logging_webhooks"
			WHERE "guildID" = $1 AND "channelID" = $2
		`,
		[guildID, channelID],
	);

	if (result.rowCount !== 1) {
		return null;
	}

	return dbParse(WebhookAuth, result.rows[0]);
}

export async function insertLoggingWebhook(
	db: Pool,
	guildID: string,
	channelID: string,
	auth: WebhookAuth,
): Promise<boolean> {
	const result = await db.query(
		`
			INSERT INTO "logging_webhooks" ("guildID", "channelID", "webhookID", "token")
			VALUES ($1, $2, $3, $4)
		`,
		[guildID, channelID, auth.webhookID, auth.token],
	);

	return result.rowCount === 1;
}

export async function updateLoggingWebhook(
	db: Pool,
	guildID: string,
	channelID: string,
	auth: WebhookAuth,
): Promise<boolean> {
	const result = await db.query(
		`
			UPDATE "logging_webhooks"
			SET "webhookID" = $3, "token" = $4
			WHERE "guildID" = $1 AND "channelID" = $2
		`,
		[guildID, channelID, auth.webhookID, auth.token],
	);

	return result.rowCount === 1;
}
