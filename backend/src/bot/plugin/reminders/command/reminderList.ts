import { dateToUnixSeconds } from "../../../../common/time.ts";
import { getReminders, type Reminder } from "../../../../db/reminders/reminders.ts";
import { Container, Text } from "../../core/helper/componentSugar.ts";
import { defineCommand, type BaseContext, type ReplyObject } from "../../core/public/command.ts";
import { permissionsGuard } from "../../core/public/helper/commandGuards.ts";
import { respondWithPaginator, type PaginatorQuery } from "../../core/public/helper/paginator.ts";
import { icons } from "../../core/public/icons.ts";
import { resolvePermissions } from "../../core/public/permissionResolution.ts";
import { remindersConfig } from "../index.ts";

export const reminderListCommand = defineCommand({
	name: ["reminderlist", "reminders", "listreminders"],
	description: "List and filter reminders.",

	trackUpdates: true,

	preRun: context => permissionsGuard(context, remindersConfig, permissions => permissions.personal_reminders),
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
	const config = remindersConfig.get(context.guild.id);

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
