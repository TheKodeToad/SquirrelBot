CREATE TABLE "api_users" (
	"id" NUMERIC(20, 0) NOT NULL,
	"username" TEXT NOT NULL,
	"avatarHash" TEXT NOT NULL
); -- TODO: remove this

CREATE TABLE "api_tokens" (
	"userID" NUMERIC(20, 0) NOT NULL,
	"hash" BYTEA NOT NULL,
	"expiresAt" TIMESTAMPTZ NOT NULL,

	PRIMARY KEY ("userID", "hash")
);
