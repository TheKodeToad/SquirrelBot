import { debugFormatPermissionContext } from "#common/discord/debugFormat.ts";
import { makeMarkdownInlineCodeblock } from "#common/discord/markdown.ts";
import { canWriteInChannel } from "#common/discord/permissions.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { TTLMap } from "#common/ttlMap.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { getCommandByName } from "#plugin/core/commandEngine/commandCache.ts";
import { listenForInteractions, unlistenForInteractions } from "#plugin/core/commandEngine/handler/componentHandler.ts";
import { STATE_CLEANUP_INTERVAL, STATE_EXPIRE_AFTER } from "#plugin/core/commandEngine/index.ts";
import { formatArgsParseError } from "#plugin/core/commandEngine/parsing/index.ts";
import { readPrefixArgs, readPrefixName } from "#plugin/core/commandEngine/parsing/prefixParser.ts";
import { StringReader } from "#plugin/core/commandEngine/parsing/stringReader.ts";
import { transformReply } from "#plugin/core/helper/commands.ts";
import { coreConfigStore } from "#plugin/core/index.ts";
import type { Command, CommandContext, Reply } from "#plugin/core/public/command.ts";
import { onBotEvent } from "#plugin/core/public/extensionPoints.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { resolvePermissions } from "#plugin/core/public/permissionResolution.ts";
import { type AnyTextableGuildChannel, Guild, GuildChannel, Member, Message, MessageFlags, MessageTypes, Permissions, type PossiblyUncachedMessage, Shard, User, Client } from "oceanic.js";

const logger = moduleLogger();

export default [
	onBotEvent({ type: "messageCreate", listener: async (ctx, message) => void await handle(ctx, message) }),
	onBotEvent({ type: "messageUpdate", listener: handleEdit }),
	onBotEvent({ type: "messageDelete", listener: handleDelete }),
];

// if anything is added here, make sure the message type can be replied to
const ALLOWED_MESSAGE_TYPES = [MessageTypes.DEFAULT, MessageTypes.REPLY];

const trackedMessages: TTLMap<string, Message> = new TTLMap(STATE_EXPIRE_AFTER);
setInterval(() => trackedMessages.cleanup(), STATE_CLEANUP_INTERVAL).unref();

async function handle(squirrelCtx: SquirrelDiscordContext, message: Message, prevResponse?: Message): Promise<boolean> {
	if (!message.inCachedGuildChannel()) {
		return false;
	}

	// yes, non-bot webhook is/has been possible
	if (message.author.bot || message.author.system || message.webhookID !== undefined) {
		return false;
	}

	if (!ALLOWED_MESSAGE_TYPES.includes(message.type)) {
		return false;
	}

	if (!canWriteInChannel(squirrelCtx.bot, message.channel, message.channel.guild.clientMember)) {
		return false;
	}

	const config = coreConfigStore.get(message.guildID);

	if (config === undefined) {
		return false;
	}

	const { prefix } = config.prefix_commands;

	const reader = new StringReader(message.content);

	const name = readPrefixName(reader, prefix);

	if (name === null) {
		return false;
	}

	const perms = resolvePermissions(config, message.member, message.channel);

	if (!perms.prefix_commands) {
		return false;
	}

	const commandEntry = getCommandByName(name);

	if (commandEntry === undefined) {
		logger.debug?.(`No command found matching '${name}' (ignored)`);
		return false;
	}

	const ctx = new PrefixContext(squirrelCtx, commandEntry.command, message, prevResponse);

	const data = commandEntry.command.preRun(ctx);

	if (data === false) {
		logger.debug?.(`Command '${name}' rejected context - ${debugFormatPermissionContext(ctx.member, ctx.channel)}`);
		return false;
	}

	if (data == null) {
		throw new Error("Nullish value returned from preRun!");
	}

	const args = readPrefixArgs(reader, commandEntry);

	if (args.error !== null) {
		await ctx.respond(
			`${icons.error} ${formatArgsParseError(args)}\n`
			+ `${icons.tip} Edit your original message to fix the error!\n`
			+ `${icons.info} Usage: ${makeMarkdownInlineCodeblock(prefix + name + commandEntry.usage)}.\n`
		);

		if (ctx._response !== null) {
			trackedMessages.set(message.id, ctx._response);
		}

		return true;
	}

	logger.debug?.(`Parsed arguments; running '${name}'`, args);

	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		await commandEntry.command.run(ctx, args.result as any, data);

		if (commandEntry.command.trackUpdates && ctx._response !== null) {
			trackedMessages.set(message.id, ctx._response);
		}
	} catch (error) {
		try {
			await ctx.respond(`:boom: Failed to execute command`);
		} catch (error) {
			logger.error?.("Error responding with error message for prefix command", error);
		}
		throw error;
	}

	return true;
}

async function handleEdit(ctx: SquirrelDiscordContext, message: Message): Promise<void> {
	const response = trackedMessages.get(message.id);

	if (!response) {
		return;
	}

	if (response !== null) {
		unlistenForInteractions(response.id);
	}

	trackedMessages.delete(message.id);

	if (!await handle(ctx, message, response)) {
		await response.delete();
	}
}

async function handleDelete(_: SquirrelDiscordContext, message: PossiblyUncachedMessage): Promise<void> {
	const response = trackedMessages.get(message.id);

	if (!response) {
		return;
	}

	trackedMessages.delete(message.id);
	unlistenForInteractions(response.id);
	await response.delete();
}

class PrefixContext implements CommandContext {
	command: Command;
	message: Message<AnyTextableGuildChannel>;

	squirrelCtx: SquirrelDiscordContext;
	get bot(): Client { return this.squirrelCtx.bot; }
	get shard(): Shard { return this.message.guild.shard; }
	get guild(): Guild { return this.message.guild; }
	get user(): User { return this.message.author; }
	get member(): Member { return this.message.member; }
	get channel(): AnyTextableGuildChannel { return this.message.channel; }

	_response: Message | null;

	constructor(squirrelCtx: SquirrelDiscordContext, command: Command, message: Message<AnyTextableGuildChannel>, response?: Message) {
		this.squirrelCtx = squirrelCtx;
		this.command = command;
		this.message = message;
		this._response = response ?? null;
	}

	async respond(reply: Reply): Promise<void> {
		const messageOptions = transformReply(reply);

		if ((this.message.flags & MessageFlags.SUPPRESS_NOTIFICATIONS) !== 0) {
			messageOptions.flags ??= 0;
			messageOptions.flags |= MessageFlags.SUPPRESS_NOTIFICATIONS;
		}

		if (this.message.channel instanceof GuildChannel
			&& !canWriteInChannel(this.bot, this.message.channel, this.message.channel.guild.clientMember)) {
			return;
		}

		if (this._response === null) {
			const config = coreConfigStore.get(this.guild.id);

			if (config === undefined) {
				return;
			}

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
			} else {
				this._response = await this.channel.createMessage(messageOptions);
			}
		} else {
			unlistenForInteractions(this._response.id);
			await this._response.edit(messageOptions);
		}

		if (typeof reply !== "string" && reply.componentHandler !== undefined) {
			listenForInteractions(this._response.id, this.message.author.id, reply.componentHandler);
		}
	}

	async _delete(): Promise<void> {
		await this._response?.delete();
	}
}
