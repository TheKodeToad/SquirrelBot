CREATE TABLE "api_users" (
	"id" SNOWFLAKE NOT NULL,
	"username" TEXT NOT NULL,
	"avatarHash" TEXT NOT NULL
); -- TODO: remove this

CREATE TABLE "api_tokens" (
	"userID" SNOWFLAKE NOT NULL,
	"hash" BYTEA NOT NULL,
	"expiresAt" TIMESTAMPTZ NOT NULL,

	PRIMARY KEY ("userID", "hash")
);
