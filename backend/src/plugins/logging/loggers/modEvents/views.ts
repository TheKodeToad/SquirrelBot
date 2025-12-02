import { DurationView, makeDurationView } from "#common/views/duration.ts";
import { GuildView, makeGuildView } from "#common/views/guild.ts";
import { makeTimestampView, TimestampView } from "#common/views/timestamp.ts";
import {
	makeMemberUserView,
	makeUserView,
	UserView,
} from "#common/views/user.ts";
import type { ModEvent } from "#plugins/moderation/public/modEvent.ts";
import { m, type InferView } from "mousetache";
import { Member } from "oceanic.js";

export const ModEventView = m.object({
	guild: GuildView,

	performedAt: TimestampView,
	expiresAt: TimestampView,
	duration: DurationView,

	moderator: UserView,
	target: UserView,

	reason: m.terminal({ noEscape: true }),

	purgeDuration: DurationView,
	dmDelivered: m.terminal({ noEscape: true }),
	caseNumber: m.terminal({ noEscape: true }),
});
export type ModEventView = InferView<typeof ModEventView>;

export function makeModEventView(action: ModEvent): ModEventView {
	const result = {
		guild: makeGuildView(action.guild),

		performedAt: makeTimestampView(action.performedAt),
		expiresAt:
			action.expiresAt !== undefined ?
				makeTimestampView(action.expiresAt)
			:	undefined,
		duration:
			action.expiresAt !== undefined ?
				makeDurationView(
					action.expiresAt.getTime() - action.performedAt.getTime(),
				)
			:	undefined,

		moderator: makeMemberUserView(action.actor),
		target:
			action.target instanceof Member ?
				makeMemberUserView(action.target)
			:	makeUserView(action.target),

		reason: action.reason,

		purgeDuration:
			(
				action.deleteMessageSeconds !== undefined
				&& action.deleteMessageSeconds !== 0
			) ?
				makeDurationView(action.deleteMessageSeconds * 1000)
			:	undefined,
		dmDelivered: action.dmDelivered,
		caseNumber: action.caseNumber,
	};

	return result;
}
