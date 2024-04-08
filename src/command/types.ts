import { APIInteractionGuildMember, BaseMessageOptions, ChatInputCommandInteraction, Guild, GuildMember, Interaction, Message, Snowflake, User } from "discord.js";

type Id = string | [string, ...string[]];

export interface Command<F extends Record<string, Flag> = Record<string, Flag>> {
	id: Id;
	flags?: F;
	support_prefix?: boolean;
	support_slash?: boolean;
	run(args: { [K in keyof F]: FlagValue<F[K]> }, context: Context): Promise<void> | void;
}

export interface Context {
	command: Command;
	user: User;
	member: GuildMember | APIInteractionGuildMember | null;
	guild: Guild | null;
	message?: Message;
	interaction?: ChatInputCommandInteraction;
	respond(reply: Reply): Promise<void>;
}

export type Reply = BaseMessageOptions & { ephemeral?: boolean; } | string;

export interface CommandGroup {
	id: Id;
	children: Command<any> | CommandGroup[];
}

export enum FlagType {
	VOID,
	BOOLEAN,
	STRING,
	NUMBER,
	USER,
	ROLE,
	CHANNEL,
	SNOWFLAKE
}

export interface Flag {
	type: FlagType;
	id: Id;
	required?: boolean;
	/** with prefix mode, becomes the unnamed flag */
	primary?: boolean;
};


type FlagValue<F extends Flag> = F["required"] extends true ? FlagTypeValue<F["type"]> : FlagTypeValue<F["type"]> | undefined;

type FlagTypeValue<F extends FlagType> =
	F extends FlagType.VOID ? boolean :
	F extends FlagType.BOOLEAN ? boolean :
	F extends FlagType.STRING ? string :
	F extends FlagType.NUMBER ? number :
	F extends FlagType.USER ? Snowflake :
	F extends FlagType.ROLE ? Snowflake :
	F extends FlagType.CHANNEL ? Snowflake :
	F extends FlagType.SNOWFLAKE ? Snowflake :
	never;
