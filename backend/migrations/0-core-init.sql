CREATE TABLE "core_guild_info" (
	"id" NUMERIC(20, 0) PRIMARY KEY,
	"name" TEXT,
	"icon_hash" TEXT,
	"owner_id" NUMERIC(20, 0),
	"allowed" BOOLEAN NOT NULL,
	"delete_at" TIMESTAMPTZ CHECK ("delete_at" IS NULL OR "allowed" = false)
);
