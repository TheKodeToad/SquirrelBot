import type { Awaitable } from "#common/general.ts";
import type { StringReader } from "#common/stringReader.ts";
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

/**
 * Any value which is permitted in args.
 */
export type AnyArgsValue = {};

export type Option =
	| BooleanOption
	| StringOption
	| IntegerOption
	| NumberOption
	| UserOption
	| RoleOption
	| ChannelOption
	| CustomOption;

export const MAX_AUTOCOMPLETE_CHOICES = 25;
export type AutocompleteFunction = (
	ctx: AutocompleteContext,
	value: string,
) => Awaitable<string[]>;

interface BaseOption {
	name: NameList;
	description?: string;

	required?: boolean;
	skipIfInvalid?: boolean;

	array?: boolean;
	position?: number;
}

interface BooleanOption extends BaseOption {
	type: "boolean";
	/**  For prefix commands - specify an option to set the value to false insetad of true. */
	negativeName?: NameList;

	/** For slash commands - override the values from yes/no. */
	values?: [string, string];

	array?: false;
	position?: undefined;
}

interface StringOption extends BaseOption {
	type: "string";

	greedy?: boolean;
	minLength?: number;
	maxLength?: number;

	autocomplete?: AutocompleteFunction;
}

interface IntegerOption extends BaseOption {
	type: "integer";
}

interface NumberOption extends BaseOption {
	type: "number";
}

interface UserOption extends BaseOption {
	type: "user";
}

interface RoleOption extends BaseOption {
	type: "role";
}

interface ChannelOption extends BaseOption {
	type: "channel";
}

interface CustomOption<T extends {} = {}> extends BaseOption {
	type: {
		name: string;
		read: (reader: StringReader) => T | null;
	};

	autocomplete?: AutocompleteFunction;
}

type OptionValue<TOpt extends Option> =
	TOpt["array"] extends true ?
		ArrayValue<BaseOptionValue<TOpt>, TOpt["required"]>
	: TOpt["required"] extends true ?
		NullableValue<BaseOptionValue<TOpt>, TOpt["required"]>
	:	BaseOptionValue<TOpt> | null;

type ArrayValue<TOpt, TRequired extends boolean | undefined> =
	TRequired extends true ? readonly [TOpt, ...TOpt[]] : readonly TOpt[];
type NullableValue<TOpt, TRequired extends boolean | undefined> =
	TRequired extends true ? TOpt : TOpt | null;

type BaseOptionValue<TOpt extends Option> =
	TOpt extends BooleanOption ? boolean
	: TOpt extends StringOption ? string
	: TOpt extends IntegerOption ? number
	: TOpt extends NumberOption ? number
	: TOpt extends UserOption ? string
	: TOpt extends RoleOption ? string
	: TOpt extends ChannelOption ? string
	: TOpt extends CustomOption<infer T> ? T
	: never;
