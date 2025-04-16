CREATE TABLE "moderation_caseNumberCounter" (
	"guildID" NUMERIC(20, 0) PRIMARY KEY REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"counter" INT NOT NULL
);

CREATE FUNCTION "moderation_cases_incrementTrigger"() RETURNS TRIGGER
AS $$
DECLARE
	next_number INT;
BEGIN
	INSERT INTO "moderation_caseNumberCounter" ("guildID", "counter")
	VALUES (new."guildID", 1)
	ON CONFLICT ("guildID")
	DO UPDATE SET "counter" = "moderation_caseNumberCounter"."counter" + 1
	RETURNING "counter" INTO next_number;

	new."number" := next_number;

	RETURN new;
END
$$
LANGUAGE PLPGSQL;

CREATE TRIGGER "moderation_cases_preInsertIncrementTrigger"
	BEFORE INSERT ON "moderation_cases"
	FOR EACH ROW
	EXECUTE FUNCTION "moderation_cases_incrementTrigger"();
