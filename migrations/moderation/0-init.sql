CREATE TABLE IF NOT EXISTS "moderation_cases" (
	"guild_id" BIGINT NOT NULL,
	"number" INT NOT NULL,

	"type" SMALLINT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"expires_at" TIMESTAMPTZ,

	"actor_id" BIGINT NOT NULL,
	"target_id" BIGINT NOT NULL,

	"reason" TEXT,

	PRIMARY KEY ("guild_id", "number")
);

CREATE INDEX IF NOT EXISTS "moderation_cases_idx_by_actor" ON "moderation_cases" ("guild_id", "actor_id");
CREATE INDEX IF NOT EXISTS "moderation_cases_idx_by_target" ON "moderation_cases" ("guild_id", "target_id");
