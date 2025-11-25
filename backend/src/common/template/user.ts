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
	createdAt: TimestampView,
	age: DurationView,
	tag: m.terminal(),
	displayName: m.terminal(),
	avatar: m.terminal({ noEscape: true }),
	globalName: m.terminal(),
	globalAvatar: m.terminal({ noEscape: true }),

	guild: GuildView,
	joinedAt: TimestampView,
	membershipDuration: DurationView,

	mention: m.terminal({ noEscape: true }),
	tagMention: m.terminal({ noEscape: true }),
	tagBoldMention: m.terminal({ noEscape: true }),
	link: m.terminal({ noEscape: true }),
	maskedLink: m.terminal({ noEscape: true }),
});
export type UserView = InferView<typeof UserView>;

export function makeUserView(user: User): UserView {
	const result = {
		id: user.id,
		get createdAt() {
			return makeTimestampView(user.createdAt);
		},
		get age() {
			return makeDurationView(Date.now() - user.createdAt.getTime());
		},
		get tag() {
			return user.tag;
		},
		get displayName() {
			return user.globalName ?? user.tag;
		},
		get avatar() {
			return user.avatarURL();
		},
		get globalName() {
			return this.displayName;
		},
		get globalAvatar() {
			return this.avatar;
		},

		get mention() {
			return user.mention;
		},
		get tagMention() {
			return formatUserTag(user);
		},
		get tagBoldMention() {
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
		get createdAt() {
			return makeTimestampView(member.createdAt);
		},
		get age() {
			return makeDurationView(Date.now() - member.createdAt.getTime());
		},
		get tag() {
			return member.tag;
		},
		get displayName() {
			return member.displayName;
		},
		get avatar() {
			return member.avatarURL();
		},

		get guild() {
			return makeGuildView(member.guild);
		},
		get joinedAt() {
			if (member.joinedAt !== null) {
				return makeTimestampView(member.joinedAt);
			} else {
				return undefined;
			}
		},
		get membershipDuration() {
			if (member.joinedAt !== null) {
				return makeDurationView(Date.now() - member.joinedAt.getTime());
			} else {
				return undefined;
			}
		},

		get mention() {
			return member.mention;
		},
		get tagMention() {
			return formatUser(member);
		},
		get tagBoldMention() {
			return formatUserBold(member);
		},
		get link() {
			return BASE_URL + Routes.USER(member.id);
		},
		get globalName() {
			return member.user.globalName;
		},
		get globalAvatar() {
			return member.user.avatarURL();
		},

		toString() {
			return this.tag;
		},
	};

	return result;
}
