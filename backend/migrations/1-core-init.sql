CREATE TABLE "core_guildInfo" (
	"id" INT PRIMARY KEY,
	"name" TEXT,
	"iconHash" TEXT,
	"ownerID" INT,
	"allowed" BOOLEAN NOT NULL,
	"deleteAt" TIMESTAMPTZ CHECK ("deleteAt" IS NULL OR "allowed" = false)
) STRICT;

CREATE TABLE "core_guildConfigs" (
	"guildID" INT REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"pluginID" TEXT NOT NULL,
	"value" TEXT NOT NULL,

	PRIMARY KEY ("guildID", "pluginID")
) STRICT;
