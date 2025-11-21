-- we don't really need these triggers
DROP FUNCTION IF EXISTS "moderation_cases_incrementTrigger" CASCADE;
DROP FUNCTION IF EXISTS "reminders_reminders_incrementTrigger" CASCADE;

-- this is broken and stops cases from being deleted
ALTER TABLE "moderation_cases"
	DROP CONSTRAINT IF EXISTS "moderation_cases_guildID_shadowedBy_fkey";
