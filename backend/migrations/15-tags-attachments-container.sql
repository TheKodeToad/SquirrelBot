ALTER TABLE "tags_tags"
	ADD "attachments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
	ADD "container" BOOLEAN NOT NULL DEFAULT FALSE,
	ADD "containerColor" INT;
