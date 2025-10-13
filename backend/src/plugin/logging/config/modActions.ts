import { messageTemplate } from "#common/schema/message.ts";
import { DurationView, makeDurationView } from "#common/template/duration.ts";
import { GuildView, makeGuildView } from "#common/template/guild.ts";
import { makeTimestampView, TimestampView } from "#common/template/timestamp.ts";
import { makeMemberUserView, makeUserView, UserView } from "#common/template/user.ts";
import { eventConfig } from "#plugin/logging/config/index.ts";
import type { CommittedModAction } from "#plugin/moderation/public/modAction.ts";
import { m, type InferView } from "mousetache";
import { Member } from "oceanic.js";

export const CommittedModActionView = m.object({
	guild: GuildView,

	performedAt: TimestampView,
	expiresAt: TimestampView,
	duration: DurationView,

	actor: UserView,
	target: UserView,
});
export type CommittedModActionView = InferView<typeof CommittedModActionView>;

export function makeCommittedModActionView(action: CommittedModAction): CommittedModActionView {
	const result = {
		guild: makeGuildView(action.guild),

		performedAt: makeTimestampView(action.performedAt),
		expiresAt: action.expiresAt !== undefined ? makeTimestampView(action.expiresAt) : undefined,
		duration: action.expiresAt !== undefined
			? makeDurationView(action.expiresAt.getTime() - action.performedAt.getTime())
			: undefined,

		actor: makeMemberUserView(action.actor),
		target: action.target instanceof Member
			? makeMemberUserView(action.target)
			: makeUserView(action.target)
	};

	return result;
}

export const UserBanEvent = eventConfig(
	messageTemplate(CommittedModActionView),
	{
		embeds: [{
			title: "User Banned",
			author: { name: "{{target}}", icon_url: "{{target.avatar}}" },
			description: "{{#reason}}>>> {{.}}{{/reason}}",
			fields: [
				{ name: "Moderator", value: "{{moderator.name_bold_mention}}" },
				{ name: "Duration", value: "{{duration}} (expires at {{expires_at}})" },
				{ name: "Deleted Messages", value: "Last {{purge_duration}}" }
			]
		}]
	}
);
