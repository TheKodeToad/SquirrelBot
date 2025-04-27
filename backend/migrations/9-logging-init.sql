CREATE TABLE "logging_webhooks" (
	"guildID" SNOWFLAKE NOT NULL,
	"channelID" SNOWFLAKE NOT NULL,
	"webhookID" SNOWFLAKE NOT NULL,
	"token" TEXT NOT NULL,

	PRIMARY KEY ("guildID", "channelID")
);

CREATE TABLE "logging_messageCache" (
	"guildID" SNOWFLAKE NOT NULL REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"channelID" SNOWFLAKE NOT NULL,
	"id" SNOWFLAKE NOT NULL,
	"lastUpdated" TIMESTAMPTZ NOT NULL,
	"authorID" SNOWFLAKE NOT NULL,
	"authorName" TEXT NOT NULL,
	"authorAvatarHash" TEXT,
	"content" TEXT NOT NULL,

	PRIMARY KEY ("guildID", "channelID", "id")
);
