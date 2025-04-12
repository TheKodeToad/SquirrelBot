import { type AnyTextableGuildChannel, Guild, GuildChannel, Member, Message, MessageTypes, Permissions, type PossiblyUncachedMessage, Shard, User } from "oceanic.js";
import { module_logger } from "../../../../../common/logger/index.ts";
import { TTLMap } from "../../../../../common/ttl_map.ts";
import { debug_format_permission_context } from "../../../../common/discord/debug_format.ts";
import { can_write_in_channel } from "../../../../common/discord/permissions.ts";
import { core_config } from "../../index.ts";
import { type Command, type CommandContext, type Reply } from "../../public/command/index.ts";
import { define_event_listener } from "../../public/event_listener.ts";
import { icons } from "../../public/icons.ts";
import { resolve_permissions } from "../../public/permission_resolution.ts";
import { get_commands_by_name } from "../command_cache.ts";
import { STATE_CLEANUP_INTERVAL, STATE_EXPIRE_AFTER, transform_reply } from "../index.ts";
import { ArgsParseError, read_command_args, read_command_name } from "../parsing/command.ts";
import { StringReader } from "../parsing/string_reader.ts";
import { listen_for_interactions, unlisten_for_interactions } from "./component_handler.ts";

const logger = module_logger();

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

	if (!perms.prefix_commands)
		return false;

	const reader = new StringReader(message.content);

	const name = read_command_name(reader, prefix);

	if (name === null)
		return false;

	const matches = get_commands_by_name(name).filter(({ command }) => command.support_prefix ?? true);

	if (matches.length !== 1) {
		logger.debug?.(`${matches.length} commands found matching '${name}' (ignored)`);
		return false;
	}

	const command_entry = matches[0]!;

	const context = new PrefixContext(command_entry.command, message, prev_response);

	const data = command_entry.command.pre_run(context);

	if (data === false) {
		logger.debug?.(`Command '${name}' rejected context - ${debug_format_permission_context(context.member, context.channel)}`);
		return false;
	}

	if (data == null)
		throw new Error("Nullish value returned from pre_run!");

	const args_result = read_command_args(reader, command_entry);

	if (args_result.error !== null) {
		switch (args_result.error) {
			case ArgsParseError.MISSING_OPTIONS:
				await context.respond(`${icons.error} Missing options: ${[...args_result.options].map(option => "'" + option + "'").join(", ")}.`);
				break;

			case ArgsParseError.BARE_NAMED_KEY:
				await context.respond(`${icons.error} Missing option name after hyphen.`);
				break;

			case ArgsParseError.BAD_NAMED_KEY:
				await context.respond(`${icons.error} No option named '${args_result.name}'.`);
				break;

			case ArgsParseError.BAD_NAMED_VALUE:
				await context.respond(`${icons.error} Invalid value passed for '${args_result.name}'.`);
				break;

			case ArgsParseError.BAD_POSITIONAL_INDEX:
				await context.respond(`${icons.error} Too many unlabeled options provided.`);
				break;

			case ArgsParseError.BAD_POSITIONAL_VALUE:
				await context.respond(`${icons.error} Invalid value passed for unlabeled option #${args_result.index + 1}.`);
				break;
		}

		if (context._response !== null)
			tracked_messages.set(message.id, context._response);

		return true;
	}

	logger.debug?.(`Parsed arguments; running '${name}'`, args_result);

	try {
		await command_entry.command.run(context, args_result.result as any, data);

		if (command_entry.command.track_updates && context._response !== null)
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

	if (!await handle(message, response))
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