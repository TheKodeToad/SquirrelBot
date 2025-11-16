CREATE TABLE "api_tokens" (
	"userID" INT NOT NULL,
	"hash" BYTEA NOT NULL,
	"expiresAt" TIMESTAMPTZ NOT NULL,

	PRIMARY KEY ("userID", "hash")
) STRICT;
