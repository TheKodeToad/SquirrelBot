import type { MemberRanking } from "#plugin/moderation/config.ts";
import type { CreateMessageOptions, Guild, Member, User } from "oceanic.js";

export enum ModActionType {
	Note = 0,
	Warn = 1,
	Unwarn = 2,
	VoiceMute = 3,
	VoiceUnmute = 4,
	Timeout = 5,
	ClearTimeout = 6,
	Kick = 7,
	Ban = 8,
	Unban = 9,
}

export function reverseModActionType(type: ModActionType): ModActionType | null {
	switch (type) {
	case ModActionType.Note:
		return null;
	case ModActionType.Warn:
		return ModActionType.Unwarn;
	case ModActionType.Unwarn:
		return ModActionType.Warn;
	case ModActionType.VoiceMute:
		return ModActionType.VoiceUnmute;
	case ModActionType.VoiceUnmute:
		return ModActionType.VoiceMute;
	case ModActionType.Timeout:
		return ModActionType.ClearTimeout;
	case ModActionType.ClearTimeout:
		return ModActionType.Timeout;
	case ModActionType.Kick:
		return null;
	case ModActionType.Ban:
		return ModActionType.Unban;
	case ModActionType.Unban:
		return ModActionType.Ban;
	}
}

// TODO: maybe it should be split into ModEvent and ModAction

/** Represents a ModAction pending perform. */
export interface ModAction {
	guild: Guild;

	type: ModActionType;
	expiresAt?: Date;

	actor: Member;
	target: Member | User;
	ranking: MemberRanking;

	reason?: string;

	deleteMessageSeconds?: number;
	directMessage?: CreateMessageOptions;
}

/** Represents a performed ModAction. */
export interface CommittedModAction extends ModAction {
	performedAt: Date;
	dmDelivered: boolean;
	caseNumber?: number;
}
