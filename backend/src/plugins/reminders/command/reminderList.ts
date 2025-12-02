import { dateToUnixSecs } from "#common/time.ts";
import {
	type ActionContext,
	type ReplyObject,
} from "#plugins/core/public/command.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugins/core/public/helper/commandGuards.ts";
import {
	respondWithPaginator,
	type PaginatorQuery,
} from "#plugins/core/public/helper/paginator.ts";
import { icons } from "#plugins/core/public/icons.ts";
import { resolvePermissions } from "#plugins/core/public/permissionResolution.ts";
import { remindersConfigStore } from "#plugins/reminders/index.ts";
import {
	getReminders,
	type Reminder,
} from "#plugins/reminders/storage/reminders.ts";
import { Container, Text } from "oceanic-component-helper";

export default defineCommand({
	name: ["reminderlist", "reminders", "listreminders"],
	description: "List and filter reminders.",

	trackUpdates: true,

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			remindersConfigStore,
			(permissions) => permissions.personalReminders,
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
	ctx: ActionContext,
	query: PaginatorQuery<Date>,
): Promise<Reminder[]> {
	const config = remindersConfigStore.get(ctx.guild.id);

	if (config === undefined) {
		return [];
	}

	const permissions = resolvePermissions(config, ctx.member, ctx.channel);

	if (!permissions.personalReminders) {
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
