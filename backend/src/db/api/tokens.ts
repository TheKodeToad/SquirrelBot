import crypto from "crypto";
import { date, object, string } from "valibot";
import { db_parse, pool } from "../index.ts";

const ALGORITHM = "sha-256";

const token_info_schema = object({
	user_id: string(),
	expires_at: date()
});

export async function generate_token(user_id: string): Promise<[token: string, expiry: Date]> {
	const secret = crypto.randomBytes(16);
	const expires_at = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7));

	const hash = Buffer.from(await crypto.subtle.digest(ALGORITHM, secret));

	pool.query(
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
	const key = await token_key(token);

	if (key === null)
		return null;

	const result = await pool.query(
		`
			SELECT "user_id", "expires_at"
			FROM "api_tokens"
			WHERE "user_id" = $1 AND "hash" = $2
		`,
		key
	);

	if (result.rowCount !== 1)
		return null;

	const { expires_at, user_id } = db_parse(token_info_schema, result.rows[0]);

	if (Date.now() >= expires_at.getDate())
		return null;

	return user_id;
}

export async function delete_token(token: string): Promise<boolean> {
	const key = await token_key(token);

	if (key === null)
		return false;

	const result = await pool.query(
		`
			DELETE FROM "api_tokens"
			WHERE "user_id" = $1 AND "hash" = $2
		`,
		key
	);

	return result.rowCount === 1;
}

async function token_key(token: string): Promise<[bigint, Buffer] | null> {
	const split_index = token.indexOf(".");

	if (split_index === -1)
		return null;

	const user_id_part = token.slice(0, split_index);
	const secret_part = token.slice(split_index + 1);

	if (user_id_part.length === 0 || secret_part.length === 0)
		return null;

	try {
		var user_id = BigInt("0x" + user_id_part);
	} catch (error) {
		if (!(error instanceof SyntaxError))
			throw error;

		return null;
	}

	const secret_buffer = Buffer.from(secret_part, "hex");
	const hash = Buffer.from(await crypto.subtle.digest(ALGORITHM, secret_buffer));

	return [user_id, hash];
}

export async function delete_expired_tokens(): Promise<void> {
	await pool.query(
		`
			DELETE FROM "api_tokens"
			WHERE "expires_at" <= $1
		`,
		[new Date]
	);
}
