CREATE TABLE "api_users" (
	"id" NUMERIC(20, 0) NOT NULL,
	"username" TEXT NOT NULL,
	"avatar_hash" TEXT NOT NULL
);

CREATE TABLE "api_tokens" (
	"user_id" NUMERIC(20, 0) NOT NULL,
	"hash" BYTEA NOT NULL,
	"expires_at" TIMESTAMPTZ NOT NULL,

	PRIMARY KEY ("user_id", "hash")
);
