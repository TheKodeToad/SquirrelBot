import { type AnyTextableGuildChannel, type CreateMessageOptions, Guild, Member, Message, type MessageComponent, type SelectMenuComponent, Shard, type TextButton, User } from "oceanic.js";

type Id = string | [string, ...string[]];

export function define_command<O extends Record<string, Option>, D extends {}>(command: Command<O, D>): Command<O, D> {
	return command;
}

export interface Command<O extends Record<string, Option> = Record<string, Option>, D extends {} = {}> {
	id: Id;
	options?: O;
	support_prefix?: boolean;
	support_slash?: boolean;
	track_updates?: boolean;

	/**
	 * Check preconditions - return false to abort execution and anything else to proceed.
	 * Note: to prevent nasty bugs this may not return null or undefined!
	 * @param context Contextual information
	 */
	pre_run(context: CommandContext): D | false;

	/**
	 * Invoke the command, and call context.respond to display output.
	 * @param context Contextual information
	 * @param args Parsed options
	 * @param data The result from pre_run
	 */
	run(context: CommandContext, args: { readonly [K in keyof O]: OptionValue<O[K]> }, data: D): Promise<void> | void;
}

export interface CommandContext {
	command: Command;
	shard: Shard;
	guild: Guild;
	user: User;
	member: Member;
	channel: AnyTextableGuildChannel;
	message?: Message<AnyTextableGuildChannel>;
	respond(reply: Reply): Promise<void>;
}

export interface ComponentContext {
	edit(reply: Reply): Promise<void>;
}

export type Reply = (Omit<CreateMessageOptions, "messageReference" | "tts" | "components"> & { components?: Component[][]; }) | string;

export type Component = ((TextButton | SelectMenuComponent) & ComponentCallback) | MessageComponent;

export interface ComponentCallback {
	callback: (context: ComponentContext) => Promise<void>;
	invoker_only?: boolean;
}

export enum OptionType {
	VOID,
	BOOLEAN,
	STRING,
	INTEGER,
	NUMBER,
	USER,
	ROLE,
	CHANNEL,
	SNOWFLAKE,
}

export interface Option {
	type: OptionType;
	id: Id;
	required?: boolean;
	array?: boolean;
	position?: number;
}

type OptionValue<F extends Option> =
	F["type"] extends OptionType.VOID ? boolean :
	F["array"] extends true ? ArrayValue<OptionTypeValue<F["type"]>, F["required"]> :
	F["required"] extends true ? NullableValue<OptionTypeValue<F["type"]>, F["required"]> :
	OptionTypeValue<F["type"]> | null;

type ArrayValue<O extends any, Required extends boolean | undefined> = Required extends true ? [O, ...O[]] : O[];
type NullableValue<O extends any, Required extends boolean | undefined> = Required extends true ? O : O | null;

export type OptionTypeValue<T extends OptionType> =
	T extends OptionType.VOID ? boolean :
	T extends OptionType.BOOLEAN ? boolean :
	T extends OptionType.STRING ? string :
	T extends OptionType.INTEGER ? number :
	T extends OptionType.NUMBER ? number :
	T extends OptionType.USER ? string :
	T extends OptionType.ROLE ? string :
	T extends OptionType.CHANNEL ? string :
	T extends OptionType.SNOWFLAKE ? string :
	never;
