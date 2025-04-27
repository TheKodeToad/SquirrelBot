import { object, string, type InferOutput } from "valibot";
import { dbParse, pool } from "../index.ts";

const webhookAuthSchema = object({
	webhookID: string(),
	token: string(),
});

export interface WebhookAuth extends InferOutput<typeof webhookAuthSchema> { }

export async function getLoggingWebhook(guildID: string, channelID: string): Promise<WebhookAuth | null> {
	const result = await pool.query(
		`
			SELECT "webhookID", "token" FROM "logging_webhooks"
			WHERE "guildID" = $1 AND "channelID" = $2
		`,
		[guildID, channelID]
	);

	if (result.rowCount !== 1)
		return null;

	return dbParse(webhookAuthSchema, result.rows[0]);
}

export async function insertLoggingWebhook(guildID: string, channelID: string, auth: WebhookAuth): Promise<boolean> {
	const result = await pool.query(
		`
			INSERT INTO "logging_webhooks" ("guildID", "channelID", "webhookID", "token")
			VALUES ($1, $2, $3, $4)
		`,
		[guildID, channelID, auth.webhookID, auth.token]
	);

	return result.rowCount === 1;
}


export async function updateLoggingWebhook(guildID: string, channelID: string, auth: WebhookAuth): Promise<boolean> {
	const result = await pool.query(
		`
			UPDATE "logging_webhooks"
			SET "webhookID" = $3, "token" = $4
			WHERE "guildID" = $1 AND "channelID" = $2
		`,
		[guildID, channelID, auth.webhookID, auth.token]
	);

	return result.rowCount === 1;
}
