ALTER TABLE "moderation_cases"
	ADD COLUMN "shadowedBy" INT,
	ADD FOREIGN KEY ("guildID", "shadowedBy") REFERENCES "moderation_cases" ON DELETE SET DEFAULT;
