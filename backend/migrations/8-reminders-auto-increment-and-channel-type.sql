ALTER TABLE "reminders_reminders"
	ADD COLUMN "channelType" SMALLINT DEFAULT 0 NOT NULL; -- default as text channel

CREATE TABLE "reminders_reminderNumberCounter" (
	"guildID" SNOWFLAKE PRIMARY KEY REFERENCES "core_guildInfo"("id") ON DELETE CASCADE,
	"counter" INT NOT NULL
);

CREATE FUNCTION "reminders_reminders_incrementTrigger"() RETURNS TRIGGER
AS $$
DECLARE
	next_number INT;
BEGIN
	INSERT INTO "reminders_reminderNumberCounter" ("guildID", "counter")
		VALUES (new."guildID", 1)
		ON CONFLICT ("guildID")
		DO UPDATE SET "counter" = "reminders_reminderNumberCounter"."counter" + 1
		RETURNING "counter" INTO next_number;

	new."number" := next_number;

	RETURN new;
END
$$
LANGUAGE PLPGSQL;

CREATE TRIGGER "reminders_reminders_preInsertIncrementTrigger"
	BEFORE INSERT ON "reminders_reminders"
	FOR EACH ROW
	EXECUTE FUNCTION "reminders_reminders_incrementTrigger"();
