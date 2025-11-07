CREATE TABLE "reminders_reminders" (
	"guildID" SNOWFLAKE NOT NULL,
	"number" INT NOT NULL,

	"ownerID" SNOWFLAKE NOT NULL,
	"channelID" SNOWFLAKE NOT NULL,

	"createdAt" TIMESTAMPTZ NOT NULL,
	"firesAt" TIMESTAMPTZ NOT NULL,

	"message" TEXT,
	"silent" BOOLEAN NOT NULL,

	PRIMARY KEY ("guildID", "number")
);

CREATE INDEX "reminders_reminders_indexByOwner" ON "reminders_reminders" ("guildID", "ownerID");
CREATE INDEX "reminders_reminders_indexByChannel" ON "reminders_reminders" ("guildID", "channelID");
