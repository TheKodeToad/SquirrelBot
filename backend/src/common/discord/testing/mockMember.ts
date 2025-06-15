/* eslint-disable @typescript-eslint/explicit-function-return-type */


import { todo } from "#common/errors.ts";
import { bot } from "#discord/index.ts";
import { Base, Permission, type Member } from "oceanic.js";

export type MockMemberProps = Partial<Member> & { id: string; };

export function mockMember(props: MockMemberProps): Member {
	// @ts-expect-error No way to properly create a type which can fit
	return new MockMember(props);
}

// @ts-expect-error Class 'MockMember' incorrectly implements class 'Member' - no way to properly implement
class MockMember extends Base implements Member {
	private _props: MockMemberProps;

	constructor(props: MockMemberProps) {
		super(props.id, bot);
		this._props = props;
	}

	get guildID() {
		if (this._props.guildID !== undefined)
			return this._props.guildID;

		if (this._props.guild !== undefined)
			return this._props.guild.id;

		return todo();
	}

	get username() {
		return this._props.username ?? this._props.user?.username ?? todo();
	}

	get displayName() {
		return this._props.displayName ?? this._props.user?.globalName ?? this.nick ?? this.username;
	}

	get tag(): string {
		if (this._props.tag !== undefined)
			return this._props.tag;

		if (this.user !== null)
			return this.user.tag;

		if (this.discriminator === "0")
			return this.username;
		else
			return this.username + "#" + this.discriminator;
	}

	get avatar() { return this._props.avatar ?? null; }
	get avatarDecorationData() { return this._props.avatarDecorationData ?? null; }
	get banner() { return this._props.banner ?? null; }
	get communicationDisabledUntil() { return this._props.communicationDisabledUntil ?? null; }
	get deaf() { return this._props.deaf ?? false; }
	get flags() { return this._props.flags ?? 0; }
	get isPending() { return this._props.isPending ?? false; }
	get joinedAt() { return this._props.joinedAt ?? null; }
	get mute() { return this._props.mute ?? false; }
	get nick() { return this._props.nick ?? null; }
	get pending() { return this._props.pending ?? false; }
	get premiumSince() { return this._props.premiumSince ?? null; }
	get presence() { return this._props.presence; }
	get roles() { return this._props.roles ?? []; }
	get user() { return this._props.user ?? todo(); }
	get bot() { return this._props.bot ?? false; }
	get discriminator() { return this._props.discriminator ?? "0"; }
	get guild() { return this._props.guild ?? todo(); }
	get mention(): string { return this._props.mention ?? `<@${this.id}>`; }
	get permissions() { return this._props.permissions ?? new Permission(0n); }
	get publicFlags() { return this._props.publicFlags ?? 0; }
	get system() { return this._props.system ?? false; }
	get voiceState() { return this._props.voiceState ?? null; }

	addRole = todo;
	avatarDecorationURL = todo;
	avatarURL = todo;
	ban = todo;
	bannerURL = todo;
	disableVerificationBypass = todo;
	edit = todo;
	editVoiceState = todo;
	enableVerificationBypass = todo;
	kick = todo;
	removeRole = todo;
	unban = todo;
}
