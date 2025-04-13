CREATE TABLE "core_guildConfigs" (
	"guildID" NUMERIC(20, 0) REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"key" TEXT NOT NULL,
	"value" TEXT NOT NULL,

	PRIMARY KEY ("guildID", "key")
);
