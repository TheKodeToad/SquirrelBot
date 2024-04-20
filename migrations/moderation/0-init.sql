CREATE TABLE IF NOT EXISTS "moderation_cases" (
	"guild_id" BIGINT NOT NULL,
	"number" INT NOT NULL,

	"created_at" TIMESTAMP NOT NULL,
	"actor_id" BIGINT NOT NULL,
	"target_id" BIGINT NOT NULL,

	"type" SMALLINT NOT NULL,
	"reason" TEXT,
	"expires_at" TIMESTAMP,

	PRIMARY KEY ("guild_id", "number")
);

CREATE INDEX IF NOT EXISTS "moderation_cases_idx_by_target" ON "moderation_cases" ("guild_id", "target_id");
