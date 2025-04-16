CREATE TABLE "moderation_cases" (
	"guildID" SNOWFLAKE REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"number" INT NOT NULL,

	"type" SMALLINT NOT NULL,
	"createdAt" TIMESTAMPTZ NOT NULL,
	"expiresAt" TIMESTAMPTZ,

	"actorID" SNOWFLAKE NOT NULL,
	"targetID" SNOWFLAKE NOT NULL,

	"reason" TEXT,

	"deleteMessageSeconds" INT,
	"dmDelivered" BOOLEAN,

	PRIMARY KEY ("guildID", "number")
);

CREATE INDEX "moderation_cases_indexByActor" ON "moderation_cases" ("guildID", "actorID");
CREATE INDEX "moderation_cases_indexByTarget" ON "moderation_cases" ("guildID", "targetID");
