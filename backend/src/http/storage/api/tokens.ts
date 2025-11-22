import { DAY } from "#common/time.ts";
import { dbParse } from "#storage/index.ts";
import crypto from "crypto";
import type { Pool } from "pg";
import { z } from "zod/v4";

const ALGORITHM = "sha-256";
const TOKEN_LIFETIME = 30 * DAY;
const TOKEN_REFRESH_THRESHOLD = 7 * DAY;

const TokenInfo = z.strictObject({
	userID: z.string(),
	expiresAt: z.date(),
});

export async function generateToken(
	db: Pool,
	userID: string,
): Promise<[token: string, expiry: Date]> {
	const secret = crypto.randomBytes(16);
	const expiresAt = new Date(Date.now() + TOKEN_LIFETIME);

	const hash = Buffer.from(await crypto.subtle.digest(ALGORITHM, secret));

	await db.query(
		`
			INSERT INTO "api_tokens" (
				"userID",
				"hash",
				"expiresAt"
			)
			VALUES ($1, $2, $3)
		`,
		[userID, hash, expiresAt],
	);

	return [
		BigInt(userID).toString(16) + "." + secret.toString("hex"),
		expiresAt,
	];
}

async function tokenKey(token: string): Promise<[bigint, Buffer] | null> {
	const splitIndex = token.indexOf(".");

	if (splitIndex === -1) {
		return null;
	}

	const userIDPart = token.slice(0, splitIndex);
	const secretPart = token.slice(splitIndex + 1);

	if (userIDPart.length === 0 || secretPart.length === 0) {
		return null;
	}

	try {
		var userID = BigInt("0x" + userIDPart);
	} catch (error) {
		if (!(error instanceof SyntaxError)) {
			throw error;
		}

		return null;
	}

	const secretBuffer = Buffer.from(secretPart, "hex");
	const hash = Buffer.from(await crypto.subtle.digest(ALGORITHM, secretBuffer));

	return [userID, hash];
}

/**
 * @returns user ID if valid
 */
export async function validateToken(
	db: Pool,
	token: string,
): Promise<string | null> {
	const key: [bigint, Buffer] | null = await tokenKey(token);

	if (key === null) {
		return null;
	}

	const result = await db.query(
		`
			SELECT "userID", "expiresAt"
			FROM "api_tokens"
			WHERE "userID" = $1 AND "hash" = $2
		`,
		key,
	);

	if (result.rowCount !== 1) {
		return null;
	}

	const { expiresAt, userID } = dbParse(TokenInfo, result.rows[0]);

	if (Date.now() >= expiresAt.getTime()) {
		await db.query(
			`
				DELETE FROM "api_tokens"
				WHERE "userID" = $1 AND "hash" = $2
			`,
			key,
		);
		return null;
	}

	if (Date.now() - expiresAt.getTime() >= TOKEN_REFRESH_THRESHOLD) {
		await db.query(
			`
				UPDATE "api_tokens"
				SET "expiresAt" = $1
				WHERE "userID" = $2 AND "hash" = $3
			`,
			[new Date(Date.now() + TOKEN_LIFETIME), userID, key[1]],
		);
	}

	return userID;
}

export async function deleteToken(db: Pool, token: string): Promise<boolean> {
	const key = await tokenKey(token);

	if (key === null) {
		return false;
	}

	const result = await db.query(
		`
			DELETE FROM "api_tokens"
			WHERE "userID" = $1 AND "hash" = $2
		`,
		key,
	);

	return result.rowCount === 1;
}

export async function deleteExpiredTokens(db: Pool): Promise<number> {
	const result = await db.query(
		`
			DELETE FROM "api_tokens"
			WHERE "expiresAt" <= $1
		`,
		[new Date()],
	);

	return result.rowCount ?? 0;
}
