CREATE TABLE "tags_tags" (
	"guildID" SNOWFLAKE NOT NULL REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"name" TEXT NOT NULL,

	"content" TEXT NOT NULL,

	PRIMARY KEY ("guildID", "name")
);
