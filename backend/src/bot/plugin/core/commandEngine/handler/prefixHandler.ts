import { type AnyTextableGuildChannel, Guild, GuildChannel, Member, Message, MessageFlags, MessageTypes, Permissions, type PossiblyUncachedMessage, Shard, User } from "oceanic.js";
import { moduleLogger } from "../../../../../common/logger/index.ts";
import { TTLMap } from "../../../../../common/ttlMap.ts";
import { debugFormatPermissionContext } from "../../../../common/discord/debugFormat.ts";
import { canWriteInChannel } from "../../../../common/discord/permissions.ts";
import { coreConfig } from "../../index.ts";
import { type Command, type CommandContext, type Reply } from "../../public/command.ts";
import { defineEventListener } from "../../public/eventListener.ts";
import { icons } from "../../public/icons.ts";
import { resolvePermissions } from "../../public/permissionResolution.ts";
import { getCommandsByName } from "../commandCache.ts";
import { STATE_CLEANUP_INTERVAL, STATE_EXPIRE_AFTER, transformReply } from "../index.ts";
import { formatArgsParseError } from "../parsing/index.ts";
import { readPrefixArgs, readPrefixName } from "../parsing/prefixParser.ts";
import { StringReader } from "../parsing/stringReader.ts";
import { unlistenForInteractions } from "./componentHandler.ts";

const logger = moduleLogger();

export const prefixSendHandler = defineEventListener("messageCreate", async message => void await handle(message));
export const prefixEditHandler = defineEventListener("messageUpdate", handleEdit);
export const prefixDeleteHandler = defineEventListener("messageDelete", handleDelete);

// if anything is added here, make sure the message type can be replied to
const ALLOWED_MESSAGE_TYPES = [MessageTypes.DEFAULT, MessageTypes.REPLY];

const trackedMessages: TTLMap<string, Message> = new TTLMap(STATE_EXPIRE_AFTER);
setInterval(() => trackedMessages.cleanup(), STATE_CLEANUP_INTERVAL).unref();

async function handle(message: Message, prevResponse?: Message): Promise<boolean> {
	if (!message.inCachedGuildChannel())
		return false;

	// yes, non-bot webhook is/has been possible
	if (message.author.bot || message.webhookID !== undefined)
		return false;

	if (!ALLOWED_MESSAGE_TYPES.includes(message.type))
		return false;

	if (!canWriteInChannel(message.channel, message.channel.guild.clientMember))
		return false;

	const config = coreConfig.get(message.guildID);

	if (config === undefined)
		return false;

	const { prefix } = config.prefix_commands;

	const reader = new StringReader(message.content);

	const name = readPrefixName(reader, prefix);

	if (name === null)
		return false;

	const perms = resolvePermissions(config, message.member, message.channel);

	if (!perms.prefix_commands)
		return false;

	const matches = getCommandsByName(name).filter(({ command }) => command.supportPrefix ?? true);

	if (matches.length !== 1) {
		logger.debug?.(`${matches.length} commands found matching '${name}' (ignored)`);
		return false;
	}

	const commandEntry = matches[0]!;

	const context = new PrefixContext(commandEntry.command, message, prevResponse);

	const data = commandEntry.command.preRun(context);

	if (data === false) {
		logger.debug?.(`Command '${name}' rejected context - ${debugFormatPermissionContext(context.member, context.channel)}`);
		return false;
	}

	if (data == null)
		throw new Error("Nullish value returned from preRun!");

	const args = readPrefixArgs(reader, commandEntry);

	if (args.error !== null) {
		await context.respond(`${icons.error} ${formatArgsParseError(args)}`);

		if (context._response !== null)
			trackedMessages.set(message.id, context._response);

		return true;
	}

	logger.debug?.(`Parsed arguments; running '${name}'`, args);

	try {
		await commandEntry.command.run(context, args.result as any, data);

		if (commandEntry.command.trackUpdates && context._response !== null)
			trackedMessages.set(message.id, context._response);
	} catch (error) {
		await context.respond(`:boom: Failed to execute command`);
		throw error;
	}

	return true;
}

async function handleEdit(message: Message) {
	const response = trackedMessages.get(message.id);

	if (!response)
		return;

	if (response !== null)
		unlistenForInteractions(response.id);

	trackedMessages.delete(message.id);

	if (!await handle(message, response))
		await response.delete();
}

async function handleDelete(message: PossiblyUncachedMessage) {
	const response = trackedMessages.get(message.id);

	if (!response)
		return;

	trackedMessages.delete(message.id);
	unlistenForInteractions(response.id);
	await response.delete();
}


class PrefixContext implements CommandContext {
	command: Command;
	message: Message<AnyTextableGuildChannel>;
	_response: Message | null;

	get shard(): Shard { return this.message.guild.shard; }
	get guild(): Guild { return this.message.guild; }
	get user(): User { return this.message.author; }
	get member(): Member { return this.message.member; }
	get channel(): AnyTextableGuildChannel { return this.message.channel; }

	constructor(command: Command, message: Message<AnyTextableGuildChannel>, response?: Message) {
		this.command = command;
		this.message = message;
		this._response = response ?? null;
	}

	async respond(reply: Reply): Promise<void> {
		let messageOptions = transformReply(reply);

		if ((this.message.flags & MessageFlags.SUPPRESS_NOTIFICATIONS) !== 0) {
			messageOptions.flags ??= 0;
			messageOptions.flags |= MessageFlags.SUPPRESS_NOTIFICATIONS;
		}

		if (this.message.channel instanceof GuildChannel
			&& !canWriteInChannel(this.message.channel, this.message.channel.guild.clientMember))
			return;

		if (this._response === null) {
			const config = coreConfig.get(this.guild.id);

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
					...messageOptions
				});
			} else
				this._response = await this.channel.createMessage(messageOptions);
		} else {
			unlistenForInteractions(this._response.id);
			await this._response.edit(messageOptions);
		}

		// if (typeof reply !== "string" && reply.components !== undefined)
		// 	listenForInteractions(this._response.id, this.message.author.id, reply.components);
	}

	async _delete(): Promise<void> {
		await this._response?.delete();
	}
}