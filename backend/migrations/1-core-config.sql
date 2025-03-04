CREATE TABLE "core_guild_configs" (
	"guild_id" NUMERIC(20, 0),
	"key" TEXT NOT NULL,
	"value" TEXT NOT NULL,

	PRIMARY KEY ("guild_id", "key")
);
