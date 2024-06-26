CREATE TABLE "core_guild_info" (
	"id" NUMERIC(20, 0) PRIMARY KEY,
	"name" TEXT NOT NULL,
	"icon_hash" TEXT,
	"owner_id" NUMERIC(20, 0)
);
