CREATE TABLE "reminders_reminders" (
	"guildID" INT NOT NULL,
	"number" INT NOT NULL,

	"ownerID" INT NOT NULL,
	"channelID" INT NOT NULL,
	"channelType" SMALLINT NOT NULL,

	"createdAt" TIMESTAMPTZ NOT NULL,
	"firesAt" TIMESTAMPTZ NOT NULL,

	"message" TEXT,
	"silent" BOOLEAN NOT NULL,

	PRIMARY KEY ("guildID", "number")
) STRICT;

CREATE TABLE "reminders_reminderNumberCounter" (
	"guildID" INT PRIMARY KEY REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"counter" INT NOT NULL
) STRICT;

CREATE INDEX "reminders_reminders_indexByOwner" ON "reminders_reminders" ("guildID", "ownerID");
CREATE INDEX "reminders_reminders_indexByChannel" ON "reminders_reminders" ("guildID", "channelID");
