CREATE TABLE "core_guildInfo" (
	"id" SNOWFLAKE PRIMARY KEY,
	"name" TEXT,
	"iconHash" TEXT,
	"ownerID" SNOWFLAKE,
	"allowed" BOOLEAN NOT NULL,
	"deleteAt" TIMESTAMPTZ CHECK ("deleteAt" IS NULL OR "allowed" = false)
);
