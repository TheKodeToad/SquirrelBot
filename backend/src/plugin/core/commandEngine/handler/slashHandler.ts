import { debugFormatPermissionContext } from "#common/discord/debugFormat.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { CACHE_PATH } from "#environment.ts";
import { EventListenerPhase } from "#extensionPoint.ts";
import {
	type CommandCacheEntry,
	getCommandByName,
	getCommands,
} from "#plugin/core/commandEngine/commandCache.ts";
import {
	listenForInteractions,
	unlistenForInteractions,
} from "#plugin/core/commandEngine/handler/componentHandler.ts";
import { AUTO_DEFER_AFTER } from "#plugin/core/commandEngine/index.ts";
import { formatArgsParseError } from "#plugin/core/commandEngine/parsing/index.ts";
import { readSlashArgs } from "#plugin/core/commandEngine/parsing/slashParser.ts";
import { safePreRun, transformReply } from "#plugin/core/helper/commands.ts";
import { coreConfigStore } from "#plugin/core/index.ts";
import {
	type Command,
	type CommandContext,
	OptionType,
	type Reply,
} from "#plugin/core/public/command.ts";
import { onBotEvent } from "#plugin/core/public/extensionPoints.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { resolvePermissions } from "#plugin/core/public/permissionResolution.ts";
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
	squirrelCtx: SquirrelDiscordContext,
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

	if (!perms.slash_commands) {
		return;
	}

	const commandEntry = getCommandByName(interaction.data.name);

	if (commandEntry === undefined) {
		logger.warn?.(
			`Received event for unknown slash command - '${interaction.data.name}' is not internally known`,
		);
		return;
	}

	const privateOption =
		interaction.data.options.getNumber("private") ??
		Number(commandEntry.command.ephemeralByDefault);
	const ephemeral = perms.ephemeral_response && Boolean(privateOption);
	const ctx = new SlashContext(
		squirrelCtx,
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
		} catch (error) {
			logger.error?.(
				"Error responding with error message for slash command",
				error,
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
			case OptionType.Flag:
				options.push({
					type: SlashOptionTypes.NUMBER,
					choices: [
						{ name: option.values?.[0] || "yes", value: 1 },
						{ name: option.values?.[1] || "no", value: 0 },
					],
					...base,
				});
				break;
			case OptionType.String:
				options.push({ type: SlashOptionTypes.STRING, ...base });
				break;
			case OptionType.Integer:
				options.push({ type: SlashOptionTypes.INTEGER, ...base });
				break;
			case OptionType.Number:
				options.push({ type: SlashOptionTypes.NUMBER, ...base });
				break;
			case OptionType.User:
				options.push({ type: SlashOptionTypes.USER, ...base });
				break;
			case OptionType.Role:
				options.push({ type: SlashOptionTypes.ROLE, ...base });
				break;
			case OptionType.Channel:
				options.push({ type: SlashOptionTypes.CHANNEL, ...base });
				break;
			case OptionType.Snowflake:
				options.push({ type: SlashOptionTypes.STRING, ...base });
				break;
			case OptionType.Duration:
				options.push({ type: SlashOptionTypes.STRING, ...base });
				break;
			default:
				option satisfies never;
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
	squirrelCtx: SquirrelDiscordContext;
	get bot(): Client {
		return this.squirrelCtx.bot;
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

	command: Command;
	ephemeral: boolean;

	_interaction: CommandInteraction<AnyTextableGuildChannel>;
	_responseID: string | null;
	_acked: boolean;
	_deferTimeout: NodeJS.Timeout | null;
	_deferPromise: Promise<void> | null;

	constructor(
		squirrelCtx: SquirrelDiscordContext,
		command: Command,
		interaction: CommandInteraction<AnyTextableGuildChannel>,
		ephemeral: boolean,
	) {
		this.squirrelCtx = squirrelCtx;
		this.command = command;
		this.ephemeral = ephemeral;
		this._interaction = interaction;
		this._responseID = null;
		this._acked = false;
		this._deferPromise = null;
		this._deferTimeout = setTimeout(
			() => {
				this._deferTimeout = null;
				this._acked = true;
				this._deferPromise = interaction
					.defer(this.ephemeral ? MessageFlags.EPHEMERAL : 0)
					.then();
			},
			Math.max(
				0,
				AUTO_DEFER_AFTER -
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

		if (this._acked) {
			await this._deferPromise;

			if (this._responseID !== null) {
				unlistenForInteractions(this._responseID);
			}

			await this._interaction
				.editOriginal(messageOptions)
				.then((message) => (this._responseID ??= message?.id ?? null));
		} else {
			this._clearTimeout();
			await this._interaction
				.reply(messageOptions)
				.then(
					({ callback }) =>
						(this._responseID ??=
							callback?.resource?.message?.id ?? null),
				);
			this._acked = true;
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
