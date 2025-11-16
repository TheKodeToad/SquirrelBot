CREATE TABLE "moderation_cases" (
	"guildID" INT REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"number" INT NOT NULL,

	"type" SMALLINT NOT NULL,
	"createdAt" TIMESTAMPTZ NOT NULL,
	"expiresAt" TIMESTAMPTZ,

	"shadowedBy" INT,
	"reversed" BOOLEAN NOT NULL,

	"actorID" INT NOT NULL,
	"targetID" INT NOT NULL,

	"reason" TEXT,

	"deleteMessageSeconds" INT,
	"dmDelivered" BOOLEAN,

	PRIMARY KEY ("guildID", "number")
) STRICT;

CREATE TABLE "moderation_caseNumberCounter" (
	"guildID" INT PRIMARY KEY REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"counter" INT NOT NULL
) STRICT;

CREATE INDEX "moderation_cases_indexByActor" ON "moderation_cases" ("guildID", "actorID");
CREATE INDEX "moderation_cases_indexByTarget" ON "moderation_cases" ("guildID", "targetID");

CREATE TABLE "moderation_tempBans" (
	"guildID" INT REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"targetID" INT NOT NULL,

	"endsAt" TIMESTAMPTZ NOT NULL,
	"caseNumber" INT,

	PRIMARY KEY ("guildID", "targetID"),
	FOREIGN KEY ("guildID", "caseNumber") REFERENCES "moderation_cases" ("guildID", "number")
) STRICT;
