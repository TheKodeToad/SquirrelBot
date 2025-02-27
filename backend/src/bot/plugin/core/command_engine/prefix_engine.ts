import { type AnyTextableGuildChannel, Guild, GuildChannel, Member, Message, MessageTypes, Permissions, type PossiblyUncachedMessage, Shard, User } from "oceanic.js";
import { is_snowflake } from "../../../../common/snowflake.ts";
import { TTLMap } from "../../../../common/ttl_map.ts";
import { can_write_in_channel } from "../../../common/discord/permissions.ts";
import { core_config } from "../index.ts";
import { type Command, type CommandContext, type Option, OptionType, type OptionTypeValue, type Reply } from "../public/command.ts";
import { define_event_listener } from "../public/event_listener.ts";
import { resolve_permissions } from "../public/permission_resolution.ts";
import { get_commands_by_name } from "./command_cache.ts";
import { listen_for_interactions, unlisten_for_interactions } from "./component_engine.ts";
import { default_id, STATE_CLEANUP_INTERVAL, STATE_EXPIRE_AFTER, transform_reply } from "./index.ts";

export const prefix_send_handler = define_event_listener("messageCreate", async message => void await handle(message));
export const prefix_edit_handler = define_event_listener("messageUpdate", handle_edit);
export const prefix_delete_handler = define_event_listener("messageDelete", handle_delete);

// if anything is added here, make sure the message type can be replied to
const ALLOWED_MESSAGE_TYPES = [MessageTypes.DEFAULT, MessageTypes.REPLY];

const tracked_messages: TTLMap<string, Message> = new TTLMap(STATE_EXPIRE_AFTER);
setInterval(() => tracked_messages.cleanup(), STATE_CLEANUP_INTERVAL);

async function handle(message: Message, prev_response?: Message): Promise<boolean> {
	if (!message.inCachedGuildChannel())
		return false;

	// yes, non-bot webhook is/has been possible
	if (message.author.bot || message.webhookID !== undefined)
		return false;

	if (!ALLOWED_MESSAGE_TYPES.includes(message.type))
		return false;

	if (!can_write_in_channel(message.channel, message.channel.guild.clientMember))
		return false;

	const config = core_config.get(message.guildID);

	if (config === undefined)
		return false;

	const { prefix } = config.prefix_commands;
	const perms = resolve_permissions(config, message.member, message.channel);

	if (!(perms.prefix_commands && message.content.startsWith(prefix)))
		return false;

	const unprefixed = message.content.slice(prefix.length);

	const name = unprefixed.split(" ", 1)[0]!;
	const matches = get_commands_by_name(name).filter(command => command.support_prefix ?? true);

	if (matches.length !== 1)
		return false;

	const command = matches[0]!;

	const context = new PrefixContext(command, message, prev_response);

	const input = unprefixed.includes(" ") ? unprefixed.slice(unprefixed.indexOf(" ") + 1) : "";
	const parser = new Parser(context, input);

	try {
		var args = parser.parse();
	} catch (error) {
		if (!(error instanceof ParseError))
			throw error;

		await context.respond(error.message);

		if (context._response !== null)
			tracked_messages.set(message.id, context._response);

		return true;
	}

	try {
		await command.run(context, args);
		if (command.track_updates && context._response !== null)
			tracked_messages.set(message.id, context._response);
	} catch (error) {
		await context.respond(`:boom: Failed to execute command`);
		throw error;
	}

	return true;
}

async function handle_edit(message: Message) {
	const response = tracked_messages.get(message.id);

	if (!response)
		return;

	if (response !== null)
		unlisten_for_interactions(response.id);

	tracked_messages.delete(message.id);

	if (!(await handle(message, response)))
		await response.delete();
}

async function handle_delete(message: PossiblyUncachedMessage) {
	const response = tracked_messages.get(message.id);

	if (!response)
		return;

	tracked_messages.delete(message.id);
	unlisten_for_interactions(response.id);
	await response.delete();
}


class PrefixContext implements CommandContext {
	command: Command;
	get shard(): Shard { return this.message.guild.shard; }
	get guild(): Guild { return this.message.guild; }
	get user(): User { return this.message.author; }
	get member(): Member { return this.message.member; }
	get channel(): AnyTextableGuildChannel { return this.message.channel; }
	message: Message<AnyTextableGuildChannel>;
	_response: Message | null;

	constructor(command: Command, message: Message<AnyTextableGuildChannel>, response?: Message) {
		this.command = command;
		this.message = message;
		this._response = response ?? null;
	}

	async respond(reply: Reply): Promise<void> {
		const message_options = transform_reply(reply);

		if (this.message.channel instanceof GuildChannel
			&& !can_write_in_channel(this.message.channel, this.message.channel.guild.clientMember))
			return;

		if (this._response === null) {
			const config = core_config.get(this.guild.id);

			if (config === undefined)
				return;

			if (
				config.prefix_commands.reply
				&& this.message.channel.permissionsOf(this.message.channel.guild.clientMember).has(Permissions.READ_MESSAGE_HISTORY)
			) {
				this._response = await this.channel.createMessage({
					messageReference: {
						guildID: this.guild.id,
						channelID: this.channel.id,
						messageID: this.message.id,
						failIfNotExists: false,
					},
					...message_options
				});
			} else
				this._response = await this.channel.createMessage(message_options);
		} else {
			unlisten_for_interactions(this._response.id);
			await this._response.edit(message_options);
		}

		if (typeof reply !== "string" && reply.components !== undefined)
			listen_for_interactions(this._response.id, this.message.author.id, reply.components);
	}

	async _delete(): Promise<void> {
		await this._response?.delete();
	}
}

class Parser {
	private context: PrefixContext;
	private input: string;
	private next: number;

	constructor(context: PrefixContext, input: string) {
		this.context = context;
		this.input = input;
		this.next = 0;
	}

	parse(): Record<string, any> {
		this.skip_spaces();

		const result: Record<string, any> = {};
		const option_lookup: Map<string, [string, Option]> = new Map;
		const positional_options: [string, Option][] = [];

		if (this.context.command.options) {
			for (const [key, option] of Object.entries(this.context.command.options)) {
				result[key] = option.array ? [] : null;

				if (option.position !== undefined)
					positional_options[option.position] = [key, option];

				if (Array.isArray(option.id)) {
					for (const id of option.id)
						option_lookup.set(id, [key, option]);
				} else
					option_lookup.set(option.id, [key, option]);
			}
		}

		if (!this.is_end() && !this.is_option()) {
			if (positional_options.length === 0)
				throw new ParseError(`Expected option but got '${this.read_word()}'`);

			for (const [index, [key, option]] of positional_options.entries()) {
				if (this.is_end())
					break;

				if (option.array)
					result[key] = this.read_values(option.type, true, option.required);
				else if (option.type === OptionType.STRING)
					result[key] = this.read_string(index !== positional_options.length - 1);
				else
					result[key] = this.read_value(option.type);
			}
		}

		while (!this.is_end()) {
			if (!this.is_option())
				throw new ParseError(`Expected option but got '${this.read_word()}'`);

			this.skip_spaces();

			let flag_id = this.read_word().slice(1);
			// allow --option-name
			// also conviniently turns "--" into ""
			if (flag_id.startsWith("-"))
				flag_id = flag_id.slice(1);

			if (!option_lookup.has(flag_id)) {
				if (flag_id.length === 0)
					throw new ParseError(`Expected option name after '--'`);
				else
					throw new ParseError(`Cannot find option '${flag_id}'`);
			}

			const [key, option] = option_lookup.get(flag_id)!;
			const value = option.array ? this.read_values(option.type) : this.read_value(option.type);

			result[key] = value;
		}

		if (this.context.command.options) {
			const missing_flags = Object.entries(this.context.command.options)
				.filter(([key, option]) => {
					if (!option.required)
						return false;

					const value = result[key];
					return value === null || (Array.isArray(value) && value.length === 0);
				});

			if (missing_flags.length !== 0) {
				const missing_flag_names = missing_flags
					.map(([_, option]) => default_id(option.id))
					.join(", ");

				throw new ParseError(`Missing ${missing_flag_names}`);
			}
		}

		return result;
	}

	is_option(): boolean {
		const next = this.peek(2);
		return next.length === 2 && next[0] === "-" && next[1] !== " ";
	}

	read_value(type: OptionType) {
		this.skip_spaces();

		switch (type) {
			case OptionType.VOID:
				return true;
			case OptionType.BOOLEAN:
				return this.read_boolean();
			case OptionType.STRING:
				return this.read_string();
			case OptionType.INTEGER:
				return this.read_integer();
			case OptionType.NUMBER:
				return this.read_number();
			case OptionType.USER:
				return this.read_user();
			case OptionType.ROLE:
				return this.read_role();
			case OptionType.CHANNEL:
				return this.read_channel();
			case OptionType.SNOWFLAKE:
				return this.read_snowflake();
		}
	}

	read_values(type: OptionType, stop_at_error = false, require_one = false): OptionTypeValue<OptionType>[] {
		switch (type) {
			case OptionType.VOID:
				return [];
			case OptionType.BOOLEAN:
				return this.read_sequence(() => this.read_boolean(), stop_at_error, require_one);
			case OptionType.STRING:
				return this.read_sequence(() => this.read_string(true), stop_at_error, require_one);
			case OptionType.INTEGER:
				return this.read_sequence(() => this.read_integer(), stop_at_error, require_one);
			case OptionType.NUMBER:
				return this.read_sequence(() => this.read_number(), stop_at_error, require_one);
			case OptionType.USER:
				return this.read_sequence(() => this.read_user(), stop_at_error, require_one);
			case OptionType.ROLE:
				return this.read_sequence(() => this.read_role(), stop_at_error, require_one);
			case OptionType.CHANNEL:
				return this.read_sequence(() => this.read_channel(), stop_at_error, require_one);
			case OptionType.SNOWFLAKE:
				return this.read_sequence(() => this.read_snowflake(), stop_at_error, require_one);
		}
	}

	read_sequence<T>(reader: () => T, stop_at_error = false, require_one = false): T[] {
		const result: T[] = [];

		while (!(this.is_end() || this.is_option())) {
			this.skip_spaces();

			let prev_position = this.next;
			try {
				result.push(reader());
			} catch (error) {
				if (!(stop_at_error && error instanceof ParseError))
					throw error;

				if (require_one && result.length === 0)
					throw error;

				this.next = prev_position;
				// return the result without the badly formatted value
				return result;
			}
		}

		return result;
	}

	// TODO: limit length and newlines when echoing back to avoid abuse

	read_user(): string {
		const input = this.read_word();
		let id = input;

		if (id.startsWith("<@") && id.endsWith(">")) {
			id = id.slice(2, id.length - 1);

			if (id.startsWith("!"))
				id = id.slice(1);
		}

		if (!is_snowflake(id))
			throw new ParseError(`Not a user: '${input}'`);

		return id;
	}

	read_role(): string {
		const input = this.read_word();
		let id = input;

		if (id.startsWith("<@&") && id.endsWith(">"))
			id = id.slice(3, id.length - 1);

		if (!is_snowflake(id))
			throw new ParseError(`Not a role: '${input}'`);

		return id;
	}

	read_channel(): string {
		const input = this.read_word();
		let id = input;

		if (id.startsWith("<#") && id.endsWith(">"))
			id = id.slice(2, id.length - 1);

		if (!is_snowflake(id))
			throw new ParseError(`Not a channel: '${input}'`);

		return id;
	}

	read_snowflake(): string {
		const id = this.read_word();

		if (!is_snowflake(id))
			throw new ParseError(`Not an ID: '${id}'`);

		return id;
	}

	read_boolean(): boolean {
		const input = this.read_word();

		switch (input.toLowerCase()) {
			case "f":
			case "false":
			case "0":
				return false;

			case "t":
			case "true":
			case "1":
				return true;

			default:
				throw new ParseError(`Expected false/f/0 or true/t/1 but got '${input}'`);
		}
	}

	read_string(limited = false): string {
		let result = "";

		if (this.peek_next() === "\"" || this.peek_next() === "'") {
			const end_char = this.read();

			while (!this.is_end() && this.read() !== end_char) {
				if (this.peek_prev() === "\\") {
					const escape_code = this.read();

					switch (escape_code) {
						case "\"":
						case "'":
						case "\\":
							result += escape_code;
							continue;

						case "n":
							result += "\n";
							break;

						case "t":
							result += "\t";
							break;
					}

					continue;
				}

				result += this.peek_prev();
			}
		} else {
			while (!this.is_end()) {
				this.read();

				if (this.peek_prev() === " " && (limited || this.is_option()))
					break;

				result += this.peek_prev();
			}
		}

		return result;
	}

	read_integer(): number {
		const input = this.read_word();
		const result = Number(input);

		if (input.length === 0 || !Number.isInteger(result))
			throw new ParseError(`Not a integer: '${input}'`);

		return result;
	}

	read_number(): number {
		const input = this.read_word();
		const result = Number(input);

		if (input === "" || Number.isNaN(result))
			throw new ParseError(`Not a number: '${input}'`);

		return result;
	}

	is_end(): boolean {
		return this.next >= this.input.length;
	}

	has(count: number) {
		return this.next + count <= this.input.length;
	}

	read(): string {
		if (this.next >= this.input.length)
			throw new Error(`Index ${this.next} out of bounds`);

		return this.input[this.next++]!;
	}

	peek_prev(): string {
		if (this.next <= 0)
			throw new Error(`Index ${this.next - 1} out of bounds`);

		return this.input[this.next - 1]!;
	}

	peek_next(): string | undefined {
		if (this.next >= this.input.length)
			throw new Error(`Index ${this.next} out of bounds`);

		return this.input[this.next];
	}

	peek(count: number): string {
		if (count === 0)
			return "";

		if (count < 0)
			return this.input.slice(Math.max(this.next + count, 0), this.next);

		return this.input.slice(this.next, Math.min(this.next + count, this.input.length));
	}

	read_word(): string {
		let result = "";

		while (!(this.is_end() || this.read() === " "))
			result += this.peek_prev();

		return result;
	}

	skip_spaces(): number {
		let count = 0;

		while (!this.is_end() && this.peek_next() === " ") {
			++count;
			this.read();
		}

		return count;
	}

}

class ParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ParseError";
	}
}