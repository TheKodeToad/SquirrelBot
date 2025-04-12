import { type AnyTextableGuildChannel, type CreateMessageOptions, Guild, Member, Message, type MessageActionRowComponent, type SelectMenuComponent, Shard, type TextButton, User } from "oceanic.js";

type NameList = [string, ...string[]];

export function defineCommand<O extends Record<string, Option>, D extends {}>(command: Command<O, D>): Command<O, D> {
	return command;
}

export interface Command<O extends Record<string, Option> = Record<string, Option>, D extends {} = {}> {
	name: NameList;
	options?: O;
	supportPrefix?: boolean;
	supportSlash?: boolean;
	trackUpdates?: boolean;

	/**
	 * Check preconditions - return false to abort execution and anything else to proceed.
	 * Note: to prevent nasty bugs this may not return null or undefined!
	 * @param context Contextual information
	 */
	preRun(context: CommandContext): D | false;

	/**
	 * Invoke the command, and call context.respond to display output.
	 * @param context Contextual information
	 * @param args Parsed options
	 * @param data The result from preRun
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

export type Component = ((TextButton | SelectMenuComponent) & ComponentCallback) | MessageActionRowComponent;

export interface ComponentCallback {
	callback: (context: ComponentContext) => Promise<void>;
	invokerOnly?: boolean;
}

export type Option =
	BooleanOption |
	FlagOption |
	StringOption |
	IntegerOption |
	NumberOption |
	UserOption |
	RoleOption |
	ChannelOption |
	SnowflakeOption;

export enum OptionType {
	BOOLEAN,
	/**
	 * Same as boolean for slash command;
	 * --name to enable and and --negative-name to disable for prefix commands.
	 */
	FLAG,
	INTEGER,
	NUMBER,
	STRING,
	SNOWFLAKE,
	USER,
	ROLE,
	CHANNEL,
}

/**
 * Any value which is permitted in args.
 */
export type AnyArgsValue = OptionValue<any>;
/**
 * Any type which is permitted in an array in args.
 */
export type AnyArgsValueItem = OptionTypeValue<any>;

interface BaseOption {
	type: OptionType;
	name: NameList;
	required?: boolean;
	array?: boolean;
	position?: number;
}

interface FlagOption extends BaseOption {
	type: OptionType.FLAG;
	negativeName?: NameList;
	array?: false;
	position?: undefined;
}

interface BooleanOption extends BaseOption { type: OptionType.BOOLEAN; }
interface StringOption extends BaseOption { type: OptionType.STRING; }
interface IntegerOption extends BaseOption { type: OptionType.INTEGER; }
interface NumberOption extends BaseOption { type: OptionType.NUMBER; }
interface UserOption extends BaseOption { type: OptionType.USER; }
interface RoleOption extends BaseOption { type: OptionType.ROLE; }
interface ChannelOption extends BaseOption { type: OptionType.CHANNEL; }
interface SnowflakeOption extends BaseOption { type: OptionType.SNOWFLAKE; }

type OptionValue<F extends Option> =
	F["array"] extends true ? ArrayValue<OptionTypeValue<F["type"]>, F["required"]> :
	F["required"] extends true ? NullableValue<OptionTypeValue<F["type"]>, F["required"]> :
	OptionTypeValue<F["type"]> | null;

type ArrayValue<O extends any, Required extends boolean | undefined> = Required extends true ? readonly [O, ...O[]] : readonly O[];
type NullableValue<O extends any, Required extends boolean | undefined> = Required extends true ? O : O | null;

type OptionTypeValue<T extends OptionType> =
	T extends OptionType.FLAG ? boolean :
	T extends OptionType.BOOLEAN ? boolean :
	T extends OptionType.STRING ? string :
	T extends OptionType.INTEGER ? number :
	T extends OptionType.NUMBER ? number :
	T extends OptionType.USER ? string :
	T extends OptionType.ROLE ? string :
	T extends OptionType.CHANNEL ? string :
	T extends OptionType.SNOWFLAKE ? string :
	never;
