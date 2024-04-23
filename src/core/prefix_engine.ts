import { CreateMessageOptions, EditMessageOptions, Guild, Member, Message, User } from "oceanic.js";
import { bot } from "..";
import { install_wrapped_listener } from "./event_filter";
import { get_commands } from "./plugin_registry";
import { Command, Context, Flag, FlagType, FlagTypeValue, Reply } from "./types/command";

export function install_prefix_engine() {
	install_wrapped_listener("messageCreate", message_create);
}

class ParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ParseError";
	}
}

// 17 - length of Jason Citron's ID
// 20 - length of 64-bit integer limit
const SNOWFLAKE_REGEX = /^[0-9]{17,20}$/;
const MAX_SNOWFLAKE_VALUE = 18446744073709551614n;
const format_flag_name = (flag: Flag) => typeof flag.id === "string" ? flag.id : flag.id[0];

function is_snowflake(id: string) {
	return SNOWFLAKE_REGEX.test(id) && BigInt(id) <= MAX_SNOWFLAKE_VALUE;
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
		const result: Record<string, any> = {};
		const flag_lookup = new Map<string, [string, Flag]>;

		if (this.context.command.flags) {
			for (const [key, flag] of Object.entries(this.context.command.flags)) {
				result[key] = flag.array ? [] : null;

				if (flag.primary) {
					flag_lookup.set("", [key, flag]);
					continue;
				}

				if (typeof flag.id === "string")
					flag_lookup.set(flag.id, [key, flag]);
				else
					flag.id.forEach(id => flag_lookup.set(id, [key, flag]));
			}
		}

		if (!this.is_end() && this.peek(2) !== "--") {
			if (!flag_lookup.has(""))
				throw new ParseError(`Expected flag but got '${this.read_word()}'`);

			const [key, flag] = flag_lookup.get("")!;
			const value = flag.array ? this.read_values(flag.type) : this.read_value(flag.type);

			result[key] = value;
		}

		while (!this.is_end()) {
			if (this.peek(2) !== "--")
				throw new ParseError(`Expected flag but got '${this.read_word()}'`);

			const flag_id = this.read_word().slice(2);

			if (!flag_lookup.has(flag_id)) {
				if (flag_id.length === 0)
					throw new ParseError("Expected flag name after '--'");
				else
					throw new ParseError(`Cannot find flag '${flag_id}'`);
			}

			const [key, flag] = flag_lookup.get(flag_id)!;
			const value = flag.array ? this.read_values(flag.type) : this.read_value(flag.type);

			result[key] = value;
		}

		if (this.context.command.flags) {
			const missing_flags = Object.entries(this.context.command.flags)
				.filter(([key, flag]) => {
					if (!flag.required)
						return false;

					const value = result[key];
					return value === null || (Array.isArray(value) && value.length === 0);
				});

			if (missing_flags.length !== 0) {
				const missing_flag_names = missing_flags
					.map(([_, flag]) => format_flag_name(flag))
					.join(", ");

				throw new ParseError(`Missing ${missing_flag_names}`);
			}
		}

		return result;
	}

	read_value(type: FlagType) {
		switch (type) {
			case FlagType.VOID:
				return true;
			case FlagType.BOOLEAN:
				return this.read_boolean();
			case FlagType.STRING:
				return this.read_string();
			case FlagType.INTEGER:
				return this.read_integer();
			case FlagType.NUMBER:
				return this.read_number();
			case FlagType.USER:
				return this.read_user();
			case FlagType.ROLE:
				return this.read_role();
			case FlagType.CHANNEL:
				return this.read_channel();
			case FlagType.SNOWFLAKE:
				return this.read_snowflake();
		}
	}

	read_values(type: FlagType): FlagTypeValue<FlagType>[] {
		switch (type) {
			case FlagType.VOID:
				return [];
			case FlagType.BOOLEAN:
				return this.read_sequence(this.read_boolean.bind(this));
			case FlagType.STRING:
				return this.read_sequence(() => this.read_string(true));
			case FlagType.INTEGER:
				return this.read_sequence(this.read_integer.bind(this));
			case FlagType.NUMBER:
				return this.read_sequence(this.read_number.bind(this));
			case FlagType.USER:
				return this.read_sequence(this.read_user.bind(this));
			case FlagType.ROLE:
				return this.read_sequence(this.read_role.bind(this));
			case FlagType.CHANNEL:
				return this.read_sequence(this.read_channel.bind(this));
			case FlagType.SNOWFLAKE:
				return this.read_sequence(this.read_snowflake.bind(this));
		}
	}

	read_sequence<T>(reader: () => T): T[] {
		const result: T[] = [];

		while (!(this.is_end() || this.peek(2) === "--"))
			result.push(reader());

		return result;
	}

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
			case "false":
			case "0":
				return false;

			case "true":
			case "1":
				return true;

			default:
				throw new ParseError(`Expected false (0) or true (1) but got '${input}'`);
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

				if (this.peek_prev() === " " && (limited || this.peek(2) === "--"))
					break;

				result += this.peek_prev();
			}
		}

		return result;
	}

	read_integer(): number {
		const input = this.read_word();
		const result = Number(input);

		if (!Number.isInteger(result))
			throw new ParseError(`Not a integer: '${input}'`);

		return result;
	}

	read_number(): number {
		const input = this.read_word();
		const result = Number(input);

		if (Number.isNaN(result))
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

		return this.input.slice(this.next, Math.min(this.next + count, this.input.length - 1));
	}

	read_word(): string {
		let result = "";

		while (!(this.is_end() || this.read() === " "))
			result += this.peek_prev();

		return result;
	}

}

class PrefixContext implements Context {
	command: Command;
	guild: Guild | null;
	user: User;
	member: Member | null;
	channel_id: string;
	message: Message;
	private _response: Message | null;

	constructor(command: Command, message: Message) {
		this.command = command;
		this.guild = message.guild;
		this.message = message;
		this.user = message.author;
		this.member = message.member ?? null;
		this.channel_id = message.channelID;
		this._response = null;
	}

	async respond(reply: Reply): Promise<void> {
		const content: CreateMessageOptions | EditMessageOptions =
			typeof reply === "string" ? { content: reply } : reply;

		if (this._response === null)
			this._response = await bot.rest.channels.createMessage(this.channel_id, content);
		else
			await this._response.edit(content);
	}
}

async function message_create(message: Message): Promise<void> {
	if (!message.inCachedGuildChannel())
		return;

	const prefix = "!";

	if (!message.content.startsWith(prefix))
		return;

	const unprefixed = message.content.slice(1);

	const name = unprefixed.split(" ", 1)[0]!;
	const matches = get_commands(name).filter(command => command.support_prefix ?? true);

	if (matches.length !== 1)
		return;

	const command = matches[0]!;
	const context = new PrefixContext(command, message);

	const input = unprefixed.includes(" ") ? unprefixed.slice(unprefixed.indexOf(" ") + 1) : "";
	const parser = new Parser(context, input);

	try {
		var args = parser.parse();
	} catch (error) {
		if (error instanceof ParseError)
			await context.respond(error.message);

		return;
	}

	try {
		await command.run(context, args);
	} catch (error) {
		await context.respond(`:boom: Failed to execute ${prefix}${command.id}`);
		throw error;
	}
}
