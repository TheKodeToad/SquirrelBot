CREATE TABLE "core_guildInfo" (
	"id" NUMERIC(20, 0) PRIMARY KEY,
	"name" TEXT,
	"iconHash" TEXT,
	"ownerID" NUMERIC(20, 0),
	"allowed" BOOLEAN NOT NULL,
	"deleteAt" TIMESTAMPTZ CHECK ("deleteAt" IS NULL OR "allowed" = false)
);
