import type { Embed } from "oceanic.js";
import { dateToUnixSeconds } from "../../../../common/time.ts";
import { getReminders, type Reminder } from "../../../../db/reminders/reminders.ts";
import { Colors } from "../../../common/discord/colors.ts";
import { defineCommand, type BaseContext, type ReplyObject } from "../../core/public/command.ts";
import { permissionsGuard } from "../../core/public/helper/commandGuards.ts";
import { respondWithPaginator, type PaginatorQuery } from "../../core/public/helper/paginator.ts";
import { icons } from "../../core/public/icons.ts";
import { resolvePermissions } from "../../core/public/permissionResolution.ts";
import { remindersConfig } from "../index.ts";

export const reminderListCommand = defineCommand({
	name: ["reminderlist", "reminders", "listreminders"],

	preRun: context => permissionsGuard(context, remindersConfig, permissions => permissions.personal_reminders),
	async run(context, args) {
		await respondWithPaginator<Reminder, Date>(
			context,
			{
				pageSize: 16,
				getKey: entry => entry.firesAt,
				lookUp: (context, query) => lookUpReminders(context, query),
				format: formatReminders,
			}
		);
	},
});

async function lookUpReminders(context: BaseContext, query: PaginatorQuery<Date>) {
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

async function formatReminders(reminders: Reminder[]): Promise<ReplyObject> {
	if (reminders.length === 0) {
		return { content: `${icons.info} No reminders found!` };
	}

	const embed: Embed = {
		title: "Reminders",
		color: Colors.blurple,
	};

	embed.description = "";

	for (const reminder of reminders) {
		embed.description += `<t:${dateToUnixSeconds(reminder.firesAt)}:R>: ${reminder.message} [#${reminder.number}]\n`;
	}

	return {
		embeds: [embed]
	};
}
