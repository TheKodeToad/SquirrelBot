import { dateToUnixSeconds } from "#common/time.ts";
import { type BaseContext, type ReplyObject } from "#plugin/core/discord/public/command.ts";
import { defineCommand } from "#plugin/core/discord/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/discord/public/helper/commandGuards.ts";
import { respondWithPaginator, type PaginatorQuery } from "#plugin/core/discord/public/helper/paginator.ts";
import { icons } from "#plugin/core/discord/public/icons.ts";
import { resolvePermissions } from "#plugin/core/discord/public/permissionResolution.ts";
import { remindersConfigStore } from "#plugin/reminders/index.ts";
import { getReminders, type Reminder } from "#plugin/reminders/storage/reminders.ts";
import { Container, Text } from "oceanic-component-helper";

export default defineCommand({
	name: ["reminderlist", "reminders", "listreminders"],
	description: "List and filter reminders.",

	trackUpdates: true,

	preRun: context => permissionsGuard(context, remindersConfigStore, permissions => permissions.personal_reminders),
	async run(context) {
		await respondWithPaginator<Reminder, Date>(
			context,
			{
				pageSize: 10,
				getKey: entry => entry.firesAt,
				lookUp: (context, query) => lookUpReminders(context, query),
				render: renderReminders,
			}
		);
	},
});

async function lookUpReminders(context: BaseContext, query: PaginatorQuery<Date>): Promise<Reminder[]> {
	const config = remindersConfigStore.get(context.guild.id);

	if (config === undefined)
		return [];

	const permissions = resolvePermissions(config, context.member, context.channel);

	if (!permissions.personal_reminders)
		return [];

	return getReminders(context.guild.id, {
		ownerID: context.user.id,
		limit: query.limit,
		firesBefore: query.before,
		firesAfter: query.after,
		reversed: query.reversed
	});
}

function renderReminders(reminders: Reminder[]): ReplyObject {
	if (reminders.length === 0)
		return { components: [Text(`${icons.info} No reminders found!`)] };

	let content = "";

	for (const reminder of reminders)
		content += `<t:${dateToUnixSeconds(reminder.firesAt)}:R> **#${reminder.number}:** ${reminder.message ?? "*No message provided.*"}\n`;

	return {
		components: [Container([Text("## Reminders"), Text(content)])]
	};
}
