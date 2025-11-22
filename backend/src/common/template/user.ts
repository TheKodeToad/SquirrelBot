import {
	formatUser,
	formatUserBold,
	formatUserTag,
} from "#common/discord/format.ts";
import { DurationView, makeDurationView } from "#common/template/duration.ts";
import { GuildView, makeGuildView } from "#common/template/guild.ts";
import {
	TimestampView,
	makeTimestampView,
} from "#common/template/timestamp.ts";
import { m, type InferView } from "mousetache";
import { BASE_URL, Member, Routes, type User } from "oceanic.js";

export const UserView = m.object({
	id: m.terminal({ noEscape: true }),
	created_at: TimestampView,
	age: DurationView,
	tag: m.terminal(),
	display_name: m.terminal(),
	avatar: m.terminal({ noEscape: true }),
	global_name: m.terminal(),
	global_avatar: m.terminal({ noEscape: true }),

	guild: GuildView,
	joined_at: TimestampView,
	membership_duration: DurationView,

	mention: m.terminal({ noEscape: true }),
	tag_mention: m.terminal({ noEscape: true }),
	tag_bold_mention: m.terminal({ noEscape: true }),
	link: m.terminal({ noEscape: true }),
	masked_link: m.terminal({ noEscape: true }),
});
export type UserView = InferView<typeof UserView>;

export function makeUserView(user: User): UserView {
	const result = {
		id: user.id,
		get created_at() {
			return makeTimestampView(user.createdAt);
		},
		get age() {
			return makeDurationView(Date.now() - user.createdAt.getTime());
		},
		get tag() {
			return user.tag;
		},
		get display_name() {
			return user.globalName ?? user.tag;
		},
		get avatar() {
			return user.avatarURL();
		},
		get global_name() {
			return this.display_name;
		},
		get global_avatar() {
			return this.avatar;
		},

		get mention() {
			return user.mention;
		},
		get tag_mention() {
			return formatUserTag(user);
		},
		get tag_bold_mention() {
			return formatUserBold(user);
		},
		get link() {
			return BASE_URL + Routes.USER(user.id);
		},

		toString() {
			return this.tag;
		},
	};

	return result;
}

export function makeMemberUserView(member: Member): UserView {
	const result = {
		id: member.id,
		get created_at() {
			return makeTimestampView(member.createdAt);
		},
		get age() {
			return makeDurationView(Date.now() - member.createdAt.getTime());
		},
		get tag() {
			return member.tag;
		},
		get display_name() {
			return member.displayName;
		},
		get avatar() {
			return member.avatarURL();
		},

		get guild() {
			return makeGuildView(member.guild);
		},
		get joined_at() {
			if (member.joinedAt !== null) {
				return makeTimestampView(member.joinedAt);
			} else {
				return undefined;
			}
		},
		get membership_duration() {
			if (member.joinedAt !== null) {
				return makeDurationView(Date.now() - member.joinedAt.getTime());
			} else {
				return undefined;
			}
		},

		get mention() {
			return member.mention;
		},
		get tag_mention() {
			return formatUser(member);
		},
		get tag_bold_mention() {
			return formatUserBold(member);
		},
		get link() {
			return BASE_URL + Routes.USER(member.id);
		},
		get global_name() {
			return member.user.globalName;
		},
		get global_avatar() {
			return member.user.avatarURL();
		},

		toString() {
			return this.tag;
		},
	};

	return result;
}
