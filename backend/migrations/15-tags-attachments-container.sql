ALTER TABLE "tags_tags"
	ADD "attachments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
	ADD "color" INT NOT NULL DEFAULT -1;
