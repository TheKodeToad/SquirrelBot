import { type ActionRowBase, type AnyTextableGuildChannel, type ButtonComponent, type ContainerComponent, type CreateMessageOptions, Guild, Member, Message, type MessageActionRow, type MessageComponent, type SectionComponent, type SelectMenuComponent, Shard, type TextButton, type ThumbnailComponent, User } from "oceanic.js";

type NameList = [string, ...string[]];

export function defineCommand<O extends Record<string, Option>, D extends {}>(command: Command<O, D>): Command<O, D> {
	return command;
}

export interface Command<O extends Record<string, Option> = Record<string, Option>, D extends {} = {}> {
	name: NameList;
	description?: string;

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

export interface BaseContext {
	shard: Shard;
	guild: Guild;
	user: User;
	member: Member;
	channel: AnyTextableGuildChannel;
	respond(reply: Reply): Promise<void>;
}

export interface CommandContext extends BaseContext {
	command: Command;
	message?: Message<AnyTextableGuildChannel>;
}

export interface ComponentContext extends BaseContext {
	edit(reply: Reply): Promise<void>;
}

export type CommandComponent =
	| CommandActionRow
	| CommandSectionComponent
	| CommandContainerComponent
	| Exclude<MessageComponent, MessageActionRow | SectionComponent | ContainerComponent>;

export type CommandActionRow = ActionRowBase<CommandActionRowComponent>;
export type CommandActionRowComponent = CommandButtonComponent | CommandSelectMenuComponent;

export type CommandContainerComponent = ContainerComponent
	& {
		components: (
			| CommandActionRow
			| CommandSectionComponent
			| Exclude<ContainerComponent["components"][number], MessageActionRow | SectionComponent>
		)[];
	};

export type CommandSectionComponent = SectionComponent & { accessory: ThumbnailComponent | CommandButtonComponent; };

export type CommandButtonComponent = CommandTextButton | Exclude<ButtonComponent, TextButton>;
export type CommandTextButton = TextButton & CommandComponentCallback<false>;
export type CommandSelectMenuComponent = SelectMenuComponent & CommandComponentCallback<true>;

export type AnyCommandComponentWithCallback = CommandTextButton | CommandSelectMenuComponent;

export interface CommandComponentCallback<WithValues extends boolean = boolean> {
	callback: WithValues extends true
	? (context: ComponentContext, values: string[]) => Promise<void>
	: (context: ComponentContext) => Promise<void>;
	invokerOnly?: boolean;
}

export type ReplyObject = Omit<CreateMessageOptions, "messageReference" | "tts" | "content"> & { components: CommandComponent[]; };
export type Reply = ReplyObject | string;

export const enum OptionType {
	Boolean,
	/**
	 * Same as boolean for slash command;
	 * --name to enable and and --negative-name to disable for prefix commands.
	 */
	Flag,
	Integer,
	Number,
	String,
	Snowflake,
	User,
	Role,
	Channel,
	Duration,
}

/**
 * Any value which is permitted in args.
 */
export type AnyArgsValue = OptionValue<any>;
/**
 * Any type which is permitted in an array in args.
 */
export type AnyArgsValueItem = OptionTypeValue<any>;

export type Option =
	BooleanOption |
	FlagOption |
	StringOption |
	IntegerOption |
	NumberOption |
	UserOption |
	RoleOption |
	ChannelOption |
	SnowflakeOption |
	DurationOption;

interface BaseOption {
	type: OptionType;
	name: NameList;
	description?: string;
	required?: boolean;
	array?: boolean;
	position?: number;
}

interface FlagOption extends BaseOption {
	type: OptionType.Flag;
	negativeName?: NameList;
	array?: false;
	position?: undefined;
}

interface BooleanOption extends BaseOption { type: OptionType.Boolean; }
interface StringOption extends BaseOption { type: OptionType.String; }
interface IntegerOption extends BaseOption { type: OptionType.Integer; }
interface NumberOption extends BaseOption { type: OptionType.Number; }
interface UserOption extends BaseOption { type: OptionType.User; }
interface RoleOption extends BaseOption { type: OptionType.Role; }
interface ChannelOption extends BaseOption { type: OptionType.Channel; }
interface SnowflakeOption extends BaseOption { type: OptionType.Snowflake; }
interface DurationOption extends BaseOption { type: OptionType.Duration; };

type OptionValue<F extends Option> =
	F["array"] extends true ? ArrayValue<OptionTypeValue<F["type"]>, F["required"]> :
	F["required"] extends true ? NullableValue<OptionTypeValue<F["type"]>, F["required"]> :
	OptionTypeValue<F["type"]> | null;

type ArrayValue<O, Required extends boolean | undefined> = Required extends true ? readonly [O, ...O[]] : readonly O[];
type NullableValue<O, Required extends boolean | undefined> = Required extends true ? O : O | null;

type OptionTypeValue<T extends OptionType> =
	T extends OptionType.Flag ? boolean :
	T extends OptionType.Boolean ? boolean :
	T extends OptionType.String ? string :
	T extends OptionType.Integer ? number :
	T extends OptionType.Number ? number :
	T extends OptionType.User ? string :
	T extends OptionType.Role ? string :
	T extends OptionType.Channel ? string :
	T extends OptionType.Snowflake ? string :
	T extends OptionType.Duration ? number :
	never;
