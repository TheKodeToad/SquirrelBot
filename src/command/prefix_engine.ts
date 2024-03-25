import { BaseMessageOptions, Client, Guild, Message, Snowflake, User } from "discord.js";
import { get_commands } from "./registry";
import { Command, Context, Flag, FlagType, Reply } from "./types";
import { isDataView } from "util/types";

export function install_prefix_engine(client: Client) {
	client.on("messageCreate", message_create);
}

class ParseError extends Error {
	constructor(message: string) {
		super(message);
	}
}

// 17 - length of Jason Citron's ID
// 20 - length of 64-bit integer limit
const SNOWFLAKE_REGEX = /[0-9]{17,20}/;

class Parser {
	private input: string;
	private next: number;

	constructor(input: string) {
		this.input = input;
		this.next = 0;
	}

	parse(context: PrefixContext) {
		const flags = Object.values(context.command.flags ?? {});
		const flag_lookup = new Map<String, Flag>;

		if (flags.length === 0) {
			if (!this.is_end())
				throw new ParseError("This command accepts no arguments");

			return;
		}

		for (const flag of flags) {
			if (flag.primary) {
				flag_lookup.set("", flag);
				continue;
			}

			if (typeof (flag.id) === "string")
				flag_lookup.set(flag.id, flag);
			else
				flag.id.forEach(id => flag_lookup.set(id, flag));
		}

		let flag: Flag | null = flag_lookup.get("") ?? null;

		while (!this.is_end()) {
			if (this.peek(2) === "--") {
				const flag_id = this.read_word().slice(2);

				if (!flag_lookup.has(flag_id))
					throw new ParseError(`Cannot find flag ${flag_id}`);

				flag = flag_lookup.get(flag_id);
			} else if (flag === null)
				throw new ParseError(`Expected a flag but got \`${this.read_word()}\``);
			else {
				context.args[typeof flag.id === "string" ? flag.id : flag.id[0]] = this.read_value(flag.type);
				flag = null;
			}
		}
	}

	read_value(type: FlagType) {
		switch (type) {
			case FlagType.VOID:
				return true;
			case FlagType.BOOLEAN:
				return this.read_boolean();
			case FlagType.STRING:
				return this.read_string();
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

	read_user(): Snowflake {
		const input = this.read_word();
		let id = input;

		if (id.startsWith("<@") && id.endsWith(">")) {
			id = id.slice(2, id.length - 1);

			if (id.startsWith("!"))
				id = id.slice(1);
		}

		if (!SNOWFLAKE_REGEX.test(id))
			throw new ParseError(`Not a user: \`${input}\``);

		return id;
	}

	read_role(): Snowflake {
		const input = this.read_word();
		let id = input;

		if (id.startsWith("<@&") && id.endsWith(">"))
			id = id.slice(3, id.length - 1);

		if (!SNOWFLAKE_REGEX.test(id))
			throw new ParseError(`Not a role: \`${input}\``);

		return id;
	}

	read_channel(): Snowflake {
		const input = this.read_word();
		let id = input;

		if (id.startsWith("<#") && id.endsWith(">"))
			id = id.slice(2, id.length - 1);

		if (!SNOWFLAKE_REGEX.test(id))
			throw new ParseError(`Not a channel: \`${input}\``);

		return id;
	}

	read_snowflake(): Snowflake {
		const input = this.read_word();

		if (!SNOWFLAKE_REGEX.test(input))
			throw new ParseError(`Not an ID: \`${input}\``);

		return input;
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
				throw new ParseError(`Expected false (0) or true (1) but got \`${input}\``);
		}
	}


	read_string() {
		let result = "";

		if (this.peek_next() === "\"" || this.peek_next() === "'") {
			const end_char = this.read();

			while (this.read() !== end_char) {
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
			let result = "";

			while (!this.is_end()) {
				this.read();

				if (this.peek_prev() === " " && this.peek(2) === "--")
					break;

				result += this.peek_prev();
			}

			return result;
		}
	}

	read_number(): number {
		const input = this.read_word();
		const result = Number(input);

		if (Number.isNaN(result))
			throw new ParseError(`Not a number: \`${input}\``);

		return result;
	}

	is_end(): boolean {
		return this.next >= this.input.length;
	}

	read(): string {
		return this.input[this.next++];
	}

	peek_prev(): string {
		return this.input[this.next - 1];
	}

	peek_next(): string {
		return this.input[this.next];
	}

	peek(count: number): string {
		if (count === 0)
			return "";

		if (count < 0)
			return this.input.slice(this.next + count, this.next);

		return this.input.slice(this.next, this.next + count);
	}

	read_word(): string {
		let result = "";

		while (!(this.is_end() || this.read() == " "))
			result += this.peek_prev();

		return result;
	}

}

class PrefixContext implements Context {
	command: Command;
	args: Record<string, any>;
	user: User;
	guild: Guild | null;
	message: Message;

	constructor(command: Command, message: Message, input: string) {
		this.command = command;
		this.args = {};
		this.message = message;
		this.user = message.author;
		this.guild = message.guild;
	}

	async respond(reply: Reply) {
		this.message.channel.send(reply);
	}
}

async function message_create(message: Message) {
	if (!message.content.startsWith("!"))
		return;

	const unprefixed = message.content.slice(1);

	const name = unprefixed.split(" ", 1)[0];
	const matches = get_commands(name).filter(command => command.support_prefix ?? true);

	if (matches.length !== 1)
		return;

	const command = matches[0];
	const input = unprefixed.includes(" ") ? unprefixed.slice(unprefixed.indexOf(" ") + 1) : "";
	const context = new PrefixContext(command, message, input);

	const parser = new Parser(input);

	try {
		parser.parse(context);
	} catch (error) {
		if (error instanceof ParseError)
			await context.respond(error.message);
		return;
	}

	try {
		await command.run(context);
	} catch (error) {
		await context.respond(`:boom: Failed to execute \`${command.id}\``);
		console.error(error);
	}
}
