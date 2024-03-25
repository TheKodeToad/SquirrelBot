import { BaseMessageOptions, EmbedBuilder, Guild, Message, Snowflake, User } from "discord.js";

type Id = string | [string, ...string[]];

export interface Command<F extends Record<string, Flag> = Record<string, Flag>> {
	id: Id;
	flags?: F;
	support_slash?: boolean;
	support_prefix?: boolean;
	run(context: Context<{ [K in keyof F]: FlagValue<F[K]> }>): Promise<void> | void;
}

export interface Context<A extends Record<string, any> = Record<string, any>> {
	command: Command;
	args: A;
	user: User;
	guild: Guild | null;
	message: Message | null;
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

export type Flag =
	(VoidFlag | BooleanFlag | StringFlag | NumberFlag | SnowflakeFlag)
	& {
		id: Id;
		required?: boolean;
		/** with prefix mode, becomes the unnamed flag */
		primary?: boolean;
	};

export interface VoidFlag {
	type: FlagType.VOID;
}

export interface BooleanFlag {
	type: FlagType.BOOLEAN;
	default?: boolean;
}

export interface StringFlag {
	type: FlagType.STRING;
	default?: string;
}

export interface NumberFlag {
	type: FlagType.NUMBER;
	default?: number;
}

export interface SnowflakeFlag {
	type: FlagType.USER | FlagType.ROLE | FlagType.CHANNEL | FlagType.SNOWFLAKE;
	default?: Snowflake;
}

type FlagValue<F extends Flag> =
	F extends VoidFlag ? boolean :
	F extends BooleanFlag ? boolean :
	F extends StringFlag ? string :
	F extends NumberFlag ? number :
	F extends SnowflakeFlag ? Snowflake :
	never;
