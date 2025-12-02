import { debugFormatPermissionContext } from "#common/discord/debugFormatting.ts";
import { moduleLogger } from "#common/logger/logger.ts";
import type { BackendDiscordContext } from "#discord/discord.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import { CACHE_PATH } from "#environment.ts";
import { EventListenerPhase } from "#extensionPoint.ts";
import { safePreRun, transformReply } from "#plugins/core/command.ts";
import {
	type CommandCacheEntry,
	getCommandByName,
	getCommands,
} from "#plugins/core/commandEngine/commandCache.ts";
import {
	listenForInteractions,
	unlistenForInteractions,
} from "#plugins/core/commandEngine/handler/componentHandler.ts";
import { formatArgsParseError } from "#plugins/core/commandEngine/parsing/parsing.ts";
import { readSlashArgs } from "#plugins/core/commandEngine/parsing/slashParser.ts";
import { COMMAND_AUTO_DEFER_AFTER } from "#plugins/core/constants.ts";
import { coreConfigStore } from "#plugins/core/plugin.ts";
import {
	type Command,
	type CommandContext,
	type Reply,
} from "#plugins/core/public/command.ts";
import { onBotEvent } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import { resolvePermissions } from "#plugins/core/public/permissionResolution.ts";
import { readFile, writeFile } from "fs/promises";
import {
	type AnyInteractionGateway,
	type AnyTextableGuildChannel,
	Client,
	CommandInteraction,
	type CreateApplicationCommandOptions,
	Guild,
	Member,
	MessageFlags,
	Shard,
	type ApplicationCommandOptions as SlashOptions,
	ApplicationCommandOptionTypes as SlashOptionTypes,
	ApplicationCommandTypes as SlashTypes,
	User,
} from "oceanic.js";
import path from "path";

const logger = moduleLogger();

export default [
	onBotInit((ctx) => syncSlashCommands(ctx.bot), EventListenerPhase.Pre),
	onBotEvent({ type: "interactionCreate", listener: handle }),
];

async function handle(
	backendCtx: BackendDiscordContext,
	interaction: AnyInteractionGateway,
): Promise<void> {
	if (!interaction.inCachedGuildChannel()) {
		return;
	}

	if (!interaction.isCommandInteraction()) {
		return;
	}

	const config = coreConfigStore.get(interaction.guildID);

	if (config === undefined) {
		return;
	}

	const perms = resolvePermissions(
		config,
		interaction.member,
		interaction.channel,
	);

	if (!perms.slashCommands) {
		return;
	}

	const commandEntry = getCommandByName(interaction.data.name);

	if (commandEntry === undefined) {
		logger.warn?.(
			`Received command interaction for unknown slash command - '${interaction.data.name}' is not internally known`,
		);
		return;
	}

	const privateOption =
		interaction.data.options.getNumber("private") ??
		Number(commandEntry.command.ephemeralByDefault);
	const ephemeral = perms.ephemeralResponse && Boolean(privateOption);
	const ctx = new SlashContext(
		backendCtx,
		commandEntry.command,
		interaction,
		ephemeral,
	);

	const data = safePreRun(ctx, commandEntry.command);

	if (data === false) {
		logger.debug?.(
			`Command '${interaction.data.name}' rejected context - ${debugFormatPermissionContext(ctx.member, ctx.channel)}`,
		);
		ctx.ephemeral = true;
		await ctx.respond(
			`${icons.error} You lack permission to execute the command in this channel.`,
		);
		return;
	}

	const args = readSlashArgs(interaction.data.options.raw, commandEntry);

	if (args.error !== null) {
		ctx.ephemeral = true;
		await ctx.respond(`${icons.error} ${formatArgsParseError(args)}`);
		return;
	}

	logger.debug?.(
		`Parsed arguments; running '${interaction.data.name}'`,
		args,
	);

	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		await commandEntry.command.run(ctx, args.result as any, data);
	} catch (error) {
		try {
			await ctx.respond(`:boom: Failed to execute command`);
		} catch (error2) {
			logger.error?.(
				"Error responding with error message for slash command",
				error2,
			);
		}
		throw error;
	} finally {
		ctx._clearTimeout();
	}
}

const PLACEHOLDER_DESCRIPTION = "No description provided.";

async function syncSlashCommands(bot: Client): Promise<void> {
	const commands = getCommands()
		.filter(({ command }) => command.supportSlash ?? true)
		.map(mapCommand);

	const cacheFile = path.resolve(
		CACHE_PATH,
		"core_syncSlashCommandsHash.bin",
	);

	const newHash = new Uint8Array(
		await crypto.subtle.digest(
			"sha-1",
			new TextEncoder().encode(JSON.stringify(commands)),
		),
	);

	// TODO: get rid of this (bad idea)
	try {
		const oldHash = await readFile(cacheFile, null);

		if (oldHash.equals(newHash)) {
			logger.debug?.(
				"Skipping slash command sync - payload is unchanged",
			);
			return;
		}
	} catch (error) {
		if (
			!(
				error instanceof Error &&
				"code" in error &&
				typeof "code" === "string"
			)
		) {
			throw error;
		}

		if (error.code !== "ENOENT") {
			throw error;
		}
	}

	logger.debug?.("Syncing global slash commands");
	await bot.application.bulkEditGlobalCommands(commands);

	await writeFile(cacheFile, newHash);
}

function mapCommand({
	command,
}: CommandCacheEntry): CreateApplicationCommandOptions {
	const options: SlashOptions[] = [];

	for (const key in command.options) {
		if (!Object.hasOwn(command.options, key)) {
			continue;
		}

		const option = command.options[key]!;

		const base = {
			name: option.name[0],
			description: option.description ?? PLACEHOLDER_DESCRIPTION,
			required: option.required ?? false,
		};

		switch (option.type) {
			case "boolean":
				options.push({
					type: SlashOptionTypes.NUMBER,
					choices: [
						{ name: option.values?.[0] || "yes", value: 1 },
						{ name: option.values?.[1] || "no", value: 0 },
					],
					...base,
				});
				break;
			case "string":
				options.push({
					type: SlashOptionTypes.STRING,
					autocomplete: option.autocomplete !== undefined,
					// FIXME: remove this when oceanic fixes this
					minLength: option.minLength as undefined,
					maxLength: option.maxLength as undefined,
					...base,
				});
				break;
			case "integer":
				options.push({ type: SlashOptionTypes.INTEGER, ...base });
				break;
			case "number":
				options.push({ type: SlashOptionTypes.NUMBER, ...base });
				break;
			case "user":
				options.push({ type: SlashOptionTypes.USER, ...base });
				break;
			case "role":
				options.push({ type: SlashOptionTypes.ROLE, ...base });
				break;
			case "channel":
				options.push({ type: SlashOptionTypes.CHANNEL, ...base });
				break;
			default:
				option satisfies object;
				options.push({ type: SlashOptionTypes.STRING, ...base });
				break;
		}
	}

	options.push({
		name: "private",
		description: "Send the response privately.",

		type: SlashOptionTypes.NUMBER,
		choices: [
			{ name: "yes", value: 1 },
			{ name: "no", value: 0 },
		],
	});

	return {
		type: SlashTypes.CHAT_INPUT,
		name: typeof command.name === "string" ? command.name : command.name[0],
		description: command.description ?? PLACEHOLDER_DESCRIPTION,
		options,
	};
}

class SlashContext implements CommandContext {
	command: Command;
	ephemeral: boolean;

	backendCtx: BackendDiscordContext;
	get bot(): Client {
		return this.backendCtx.bot;
	}
	get shard(): Shard {
		return this._interaction.guild.shard;
	}
	get guild(): Guild {
		return this._interaction.guild;
	}
	get user(): User {
		return this._interaction.user;
	}
	get member(): Member {
		return this._interaction.member;
	}
	get channel(): AnyTextableGuildChannel {
		return this._interaction.channel;
	}

	_interaction: CommandInteraction<AnyTextableGuildChannel>;
	_responseID: string | null;
	_replied: boolean;
	_deferTimeout: NodeJS.Timeout | null;
	_deferPromise: Promise<void> | null;

	constructor(
		backendCtx: BackendDiscordContext,
		command: Command,
		interaction: CommandInteraction<AnyTextableGuildChannel>,
		ephemeral: boolean,
	) {
		this.backendCtx = backendCtx;
		this.command = command;
		this.ephemeral = ephemeral;
		this._interaction = interaction;
		this._responseID = null;
		this._replied = false;
		this._deferPromise = null;
		this._deferTimeout = setTimeout(
			() => {
				this._deferTimeout = null;
				this._replied = true;
				this._deferPromise = interaction
					.defer(this.ephemeral ? MessageFlags.EPHEMERAL : 0)
					.then();
			},
			Math.max(
				0,
				COMMAND_AUTO_DEFER_AFTER -
					(Date.now() - interaction.createdAt.getTime()),
			),
		).unref();
	}

	async respond(reply: Reply): Promise<void> {
		const messageOptions = transformReply(reply);

		if (this.ephemeral) {
			messageOptions.flags |= MessageFlags.EPHEMERAL;
		} else {
			messageOptions.flags &= ~MessageFlags.EPHEMERAL;
		}

		if (this._replied) {
			await this._deferPromise;

			if (this._responseID !== null) {
				unlistenForInteractions(this._responseID);
			}

			const message =
				await this._interaction.editOriginal(messageOptions);
			this._responseID ??= message?.id ?? null;
		} else {
			this._clearTimeout();

			const response = await this._interaction.reply(messageOptions);
			this._responseID ??=
				response.callback?.resource?.message?.id ?? null;
			this._replied = true;
		}

		if (
			typeof reply !== "string" &&
			reply.componentHandler !== undefined &&
			this._responseID !== null
		) {
			listenForInteractions(
				this._responseID,
				this._interaction.user.id,
				reply.componentHandler,
			);
		}
	}

	_clearTimeout(): void {
		if (this._deferTimeout !== null) {
			clearTimeout(this._deferTimeout);
			this._deferTimeout = null;
		}
	}
}
