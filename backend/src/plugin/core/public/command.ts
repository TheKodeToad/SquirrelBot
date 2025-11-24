import type { Awaitable } from "#common/general.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import {
	type AnyTextableGuildChannel,
	Client,
	type CreateMessageOptions,
	Guild,
	Member,
	Message,
	type MessageComponent,
	Shard,
	User,
} from "oceanic.js";

type NameList = [string, ...string[]];

export interface Command<
	TOpts extends Record<string, Option> = Record<string, Option>,
	TData extends {} = {},
> {
	name: NameList;
	description?: string;

	options?: TOpts;
	supportPrefix?: boolean;
	supportSlash?: boolean;
	trackUpdates?: boolean;
	ephemeralByDefault?: boolean;

	/**
	 * Check preconditions - return false to abort execution and anything else to proceed.
	 * Note: to prevent nasty bugs this may not return null or undefined!
	 * @param ctx Contextual information
	 */
	preRun(ctx: ActionContext): TData | false;

	/**
	 * Invoke the command, and call ctx.respond to display output.
	 * @param ctx Contextual information
	 * @param args Parsed options
	 * @param data The result from preRun
	 */
	run(
		ctx: CommandContext,
		args: { readonly [K in keyof TOpts]: OptionValue<TOpts[K]> },
		data: TData,
	): Promise<void> | void;
}

export interface ActionContext {
	squirrelCtx: SquirrelDiscordContext;
	bot: Client;
	shard: Shard;
	guild: Guild;
	user: User;
	member: Member;
	channel: AnyTextableGuildChannel;
}

export interface AutocompleteContext extends ActionContext {
	command: Command;
}

export interface CommandContext extends ActionContext {
	command: Command;
	ephemeral?: boolean;
	message?: Message<AnyTextableGuildChannel>;
	respond: (reply: Reply) => Promise<void>;
}

export interface ComponentContext extends ActionContext {
	/** The ID of the user who initially ran the command */
	originalUserID: string;
	respond: (reply: Reply) => Promise<void>;
	edit: (reply: Reply) => Promise<void>;
}

export interface ReplyObject
	extends Omit<CreateMessageOptions, "messageReference" | "tts" | "content"> {
	components: MessageComponent[];
	componentHandler?: (
		this: void,
		ctx: ComponentContext,
		customID: string,
		values?: string[],
	) => Promise<void> | void;
}

export type Reply = ReplyObject | string;

export const enum OptionType {
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
	| FlagOption
	| StringOption
	| IntegerOption
	| NumberOption
	| UserOption
	| RoleOption
	| ChannelOption
	| SnowflakeOption
	| DurationOption;

interface BaseOption {
	type: OptionType;
	name: NameList;
	description?: string;
	required?: boolean;
	skipIfInvalid?: boolean;
	array?: boolean;
	position?: number;
}

interface FlagOption extends BaseOption {
	type: OptionType.Flag;
	/**  For prefix commands - specify an option to set the value to false insetad of true. */
	negativeName?: NameList;
	/** For slash commands - override the values from yes/no. */
	values?: [string, string];
	array?: false;
	position?: undefined;
}

interface StringOption extends BaseOption {
	type: OptionType.String;
	minLength?: number;
	maxLength?: number;
	/** For prefix commands - set to false to only parse one word unless quoted. */
	greedy?: boolean;
	/** For slash commands - provide autocompletion */
	autocomplete?: (
		ctx: AutocompleteContext,
		value: string,
	) => Awaitable<string[]>;
}

interface IntegerOption extends BaseOption {
	type: OptionType.Integer;
}

interface NumberOption extends BaseOption {
	type: OptionType.Number;
}

interface UserOption extends BaseOption {
	type: OptionType.User;
}

interface RoleOption extends BaseOption {
	type: OptionType.Role;
}

interface ChannelOption extends BaseOption {
	type: OptionType.Channel;
}

interface SnowflakeOption extends BaseOption {
	type: OptionType.Snowflake;
}

interface DurationOption extends BaseOption {
	type: OptionType.Duration;
}

type OptionValue<F extends Option> = F["array"] extends true
	? ArrayValue<OptionTypeValue<F["type"]>, F["required"]>
	: F["required"] extends true
		? NullableValue<OptionTypeValue<F["type"]>, F["required"]>
		: OptionTypeValue<F["type"]> | null;

type ArrayValue<
	TOpt,
	TRequired extends boolean | undefined,
> = TRequired extends true ? readonly [TOpt, ...TOpt[]] : readonly TOpt[];
type NullableValue<
	TOpt,
	TRequired extends boolean | undefined,
> = TRequired extends true ? TOpt : TOpt | null;

type OptionTypeValue<T extends OptionType> = T extends OptionType.Flag
	? boolean
	: T extends OptionType.String
		? string
		: T extends OptionType.Integer
			? number
			: T extends OptionType.Number
				? number
				: T extends OptionType.User
					? string
					: T extends OptionType.Role
						? string
						: T extends OptionType.Channel
							? string
							: T extends OptionType.Snowflake
								? string
								: T extends OptionType.Duration
									? number
									: never;
