CREATE TABLE "core_guildConfigs" (
	"guildID" SNOWFLAKE REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"key" TEXT NOT NULL,
	"value" TEXT NOT NULL,

	PRIMARY KEY ("guildID", "key")
);
