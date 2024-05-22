import crypto from "crypto";
import { database } from "..";

const ALGORITHM = "sha-256";

export async function generate_token(user_id: string): Promise<[token: string, expiry: Date]> {
	const secret = crypto.randomBytes(16);
	const expires_at = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7));

	const hash = Buffer.from(await crypto.subtle.digest(ALGORITHM, secret));

	database.query(
		`
			INSERT INTO "api_tokens" (
				"user_id",
				"hash",
				"expires_at"
			)
			VALUES ($1, $2, $3)
		`,
		[user_id, hash, expires_at]
	);

	return [BigInt(user_id).toString(16) + "." + secret.toString("hex"), expires_at];
}

/**
 * @returns user ID if valid
 */
export async function validate_token(token: string): Promise<string | null> {
	const split_index = token.indexOf(".");

	if (split_index === -1)
		return null;

	const user_id_part = token.slice(0, split_index);
	const secret_part = token.slice(split_index + 1);

	if (user_id_part.length === 0 || secret_part.length === 0)
		return null;

	const user_id = BigInt("0x" + token);

	const secret_buffer = Buffer.from(secret_part, "hex");
	const hash = await crypto.subtle.digest(ALGORITHM, secret_buffer);

	const result = await database.query(
		`
			SELECT "owner", "expires_at"
			FROM "api_tokens"
			WHERE "user_id" = $1 AND "hash" = $2
		`,
		[user_id, hash]
	);

	if (result.rowCount !== 1)
		return null;

	if (Date.now() >= result.rows[0].expires_at)
		return null;

	return result.rows[0].user_id;
}
