CREATE TABLE "moderation_tempBans" (
	"guildID" SNOWFLAKE REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"targetID" SNOWFLAKE NOT NULL,

	"endsAt" TIMESTAMPTZ NOT NULL,
	"caseNumber" INT,

	PRIMARY KEY ("guildID", "targetID"),
	FOREIGN KEY ("guildID", "caseNumber") REFERENCES "moderation_cases" ("guildID", "number")
);
