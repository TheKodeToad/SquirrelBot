import { dateToUnixSecs } from "#common/time.ts";
import {
	type BaseCommandContext,
	type ReplyObject,
} from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import {
	respondWithPaginator,
	type PaginatorQuery,
} from "#plugin/core/public/helper/paginator.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { resolvePermissions } from "#plugin/core/public/permissionResolution.ts";
import { remindersConfigStore } from "#plugin/reminders/index.ts";
import {
	getReminders,
	type Reminder,
} from "#plugin/reminders/storage/reminders.ts";
import { Container, Text } from "oceanic-component-helper";

export default defineCommand({
	name: ["reminderlist", "reminders", "listreminders"],
	description: "List and filter reminders.",

	trackUpdates: true,

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			remindersConfigStore,
			(permissions) => permissions.personal_reminders,
		),
	async run(ctx) {
		await respondWithPaginator<Reminder, Date>(ctx, {
			pageSize: 10,
			getKey: (entry) => entry.firesAt,
			lookUp: (ctx, query) => lookUpReminders(ctx, query),
			render: renderReminders,
		});
	},
});

async function lookUpReminders(
	ctx: BaseCommandContext,
	query: PaginatorQuery<Date>,
): Promise<Reminder[]> {
	const config = remindersConfigStore.get(ctx.guild.id);

	if (config === undefined) {
		return [];
	}

	const permissions = resolvePermissions(config, ctx.member, ctx.channel);

	if (!permissions.personal_reminders) {
		return [];
	}

	return getReminders(ctx.squirrelCtx.db, ctx.guild.id, {
		ownerID: ctx.user.id,
		limit: query.limit,
		firesBefore: query.before,
		firesAfter: query.after,
		reversed: query.reversed,
	});
}

function renderReminders(reminders: Reminder[]): ReplyObject {
	if (reminders.length === 0) {
		return { components: [Text(`${icons.info} No reminders found!`)] };
	}

	let content = "";

	for (const reminder of reminders) {
		content += `<t:${dateToUnixSecs(reminder.firesAt)}:R> **#${reminder.number}:** ${reminder.message ?? "*No message provided.*"}\n`;
	}

	return {
		components: [Container([Text("## Reminders"), Text(content)])],
	};
}
