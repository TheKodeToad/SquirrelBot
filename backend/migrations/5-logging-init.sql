CREATE TABLE "logging_webhooks" (
	"guildID" INT NOT NULL,
	"channelID" INT NOT NULL,
	"webhookID" INT NOT NULL,
	"token" TEXT NOT NULL,

	PRIMARY KEY ("guildID", "channelID")
) STRICT;

CREATE TABLE "logging_messageCache" (
	"guildID" INT NOT NULL REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"channelID" INT NOT NULL,
	"id" INT NOT NULL,
	"lastUpdated" TIMESTAMPTZ NOT NULL,
	"authorID" INT NOT NULL,
	"authorName" TEXT NOT NULL,
	"authorAvatarHash" TEXT,
	"content" TEXT NOT NULL,

	PRIMARY KEY ("guildID", "channelID", "id")
) STRICT;
