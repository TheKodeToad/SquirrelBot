import type { Guild, Member, User } from "oceanic.js";

export enum ModEventType {
	Note = 0,
	Warn = 1,
	Timeout = 5,
	ClearTimeout = 6,
	Kick = 7,
	Ban = 8,
	Unban = 9,
}

export function reverseModEventType(type: ModEventType): ModEventType | null {
	switch (type) {
	case ModEventType.Note:
		return null;
	case ModEventType.Warn:
		return null;
	case ModEventType.Timeout:
		return ModEventType.ClearTimeout;
	case ModEventType.ClearTimeout:
		return ModEventType.Timeout;
	case ModEventType.Kick:
		return null;
	case ModEventType.Ban:
		return ModEventType.Unban;
	case ModEventType.Unban:
		return ModEventType.Ban;
	}
}

export interface ModEvent {
	guild: Guild;

	type: ModEventType;
	performedAt: Date;
	expiresAt?: Date;

	actor: Member;
	target: Member | User;

	reason?: string;

	deleteMessageSeconds?: number;
	dmDelivered: boolean;
	caseNumber?: number;
}
