import crypto from "crypto";
import { date, object, string } from "valibot";
import { dbParse, pool } from "../index.ts";

const ALGORITHM = "sha-256";

const tokenInfoSchema = object({
	user_id: string(),
	expires_at: date()
});

export async function generateToken(userID: string): Promise<[token: string, expiry: Date]> {
	const secret = crypto.randomBytes(16);
	const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7));

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
		[userID, hash, expiresAt]
	);

	return [BigInt(userID).toString(16) + "." + secret.toString("hex"), expiresAt];
}

/**
 * @returns user ID if valid
 */
export async function validateToken(token: string): Promise<string | null> {
	const key = await tokenKey(token);

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

	const { expires_at, user_id } = dbParse(tokenInfoSchema, result.rows[0]);

	if (Date.now() >= expires_at.getTime())
		return null;

	return user_id;
}

export async function deleteToken(token: string): Promise<boolean> {
	const key = await tokenKey(token);

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

async function tokenKey(token: string): Promise<[bigint, Buffer] | null> {
	const splitIndex = token.indexOf(".");

	if (splitIndex === -1)
		return null;

	const userIDPart = token.slice(0, splitIndex);
	const secretPart = token.slice(splitIndex + 1);

	if (userIDPart.length === 0 || secretPart.length === 0)
		return null;

	try {
		var userID = BigInt("0x" + userIDPart);
	} catch (error) {
		if (!(error instanceof SyntaxError))
			throw error;

		return null;
	}

	const secretBuffer = Buffer.from(secretPart, "hex");
	const hash = Buffer.from(await crypto.subtle.digest(ALGORITHM, secretBuffer));

	return [userID, hash];
}

export async function deleteExpiredTokens(): Promise<void> {
	await pool.query(
		`
			DELETE FROM "api_tokens"
			WHERE "expires_at" <= $1
		`,
		[new Date]
	);
}
