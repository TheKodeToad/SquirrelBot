import { debugFormatPermissionContext } from "#common/discord/debugFormat.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { requireExhaustiveSwitch } from "#common/types.ts";
import { bot } from "#discord/index.ts";
import { CACHE_PATH } from "#environment.ts";
import { getCommandByName, getCommands } from "#plugin/core/commandEngine/commandCache.ts";
import { listenForInteractions, unlistenForInteractions } from "#plugin/core/commandEngine/handler/componentHandler.ts";
import { AUTO_DEFER_AFTER } from "#plugin/core/commandEngine/index.ts";
import { formatArgsParseError } from "#plugin/core/commandEngine/parsing/index.ts";
import { readSlashArgs } from "#plugin/core/commandEngine/parsing/slashParser.ts";
import { transformReply } from "#plugin/core/helper/commands.ts";
import { coreConfigStore } from "#plugin/core/index.ts";
import { type Command, type CommandContext, OptionType, type Reply } from "#plugin/core/public/command.ts";
import { onBotEvent } from "#plugin/core/public/extensionPoints.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { resolvePermissions } from "#plugin/core/public/permissionResolution.ts";
import { readFile, writeFile } from "fs/promises";
import { type AnyInteractionGateway, type AnyTextableGuildChannel, type ApplicationCommandOptions, ApplicationCommandOptionTypes, ApplicationCommandTypes, CommandInteraction, type CreateApplicationCommandOptions, Guild, Member, MessageFlags, Shard, User } from "oceanic.js";
import path from "path";

const logger = moduleLogger();

export default [
	onBotEvent({ type: "interactionCreate", listener: handle }),
];

async function handle(interaction: AnyInteractionGateway): Promise<void> {
	if (!interaction.inCachedGuildChannel())
		return;

	if (!interaction.isCommandInteraction())
		return;

	const config = coreConfigStore.get(interaction.guildID);

	if (config === undefined)
		return;

	const perms = resolvePermissions(config, interaction.member, interaction.channel);

	if (!perms.slash_commands)
		return;

	const commandEntry = getCommandByName(interaction.data.name);

	if (commandEntry === undefined) {
		logger.warn?.(`Received event for unknown slash command - '${interaction.data.name}' is not internally known`);
		return;
	}

	const ephemeral = perms.ephemeral_response && (interaction.data.options.getBoolean("private") ?? false);
	const context = new SlashContext(commandEntry.command, interaction, ephemeral);

	const data = commandEntry.command.preRun(context);

	if (data === false) {
		logger.debug?.(`Command '${interaction.data.name}' rejected context - ${debugFormatPermissionContext(context.member, context.channel)}`);
		context._ephemeral = true;
		await context.respond(`${icons.error} You lack permission to execute the command in this channel.`);
		return;
	}

	if (data == null)
		throw new Error("Nullish value returned from preRun!");

	const args = readSlashArgs(interaction.data.options.raw, commandEntry);

	if (args.error !== null) {
		context._ephemeral = true;
		await context.respond(`${icons.error} ${formatArgsParseError(args)}`);
		return;
	}

	logger.debug?.(`Parsed arguments; running '${interaction.data.name}'`, args);

	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		await commandEntry.command.run(context, args.result as any, data);
	} catch (error) {
		try {
			await context.respond(`:boom: Failed to execute command`);
		} catch (error) {
			logger.error?.("Error responding with error message for slash command", error);
		}
		throw error;
	} finally {
		context._clearTimeout();
	}
}

const PLACEHOLDER_DESCRIPTION = "No description provided.";

export async function syncSlashCommands(): Promise<void> {
	const commands = getCommands().filter(({ command }) => command.supportSlash ?? true).map(({ command }) => {
		const options: ApplicationCommandOptions[] = [];

		if (command.options !== undefined) {
			for (const key in command.options) {
				if (!Object.hasOwn(command.options, key))
					continue;

				const option = command.options[key]!;

				options.push({
					name: option.name[0],
					description: option.description ?? PLACEHOLDER_DESCRIPTION,
					required: option.required ?? false,
					type: mapOptionType(option.type),
				});
			}
		}

		options.push({
			name: "private",
			description: "Send the response privately.",
			type: ApplicationCommandOptionTypes.BOOLEAN,
		});

		return {
			type: ApplicationCommandTypes.CHAT_INPUT,
			name: typeof command.name === "string" ? command.name : command.name[0],
			description: command.description ?? PLACEHOLDER_DESCRIPTION,
			options,
		} satisfies CreateApplicationCommandOptions;
	});

	const cacheFile = path.resolve(CACHE_PATH, "core_syncSlashCommandsHash.bin");

	const newHash = new Uint8Array(await crypto.subtle.digest("sha-1", new TextEncoder().encode(JSON.stringify(commands))));

	try {
		const oldHash = await readFile(cacheFile, null);

		if (oldHash.equals(newHash)) {
			logger.debug?.("Skipping slash command sync - payload is unchanged");
			return;
		}
	} catch (error) {
		if (!(error instanceof Error && "code" in error && typeof "code" === "string"))
			throw error;

		if (error.code !== "ENOENT")
			throw error;
	}

	await bot.application.bulkEditGlobalCommands(commands);

	await writeFile(cacheFile, newHash);
}

// so union of everything returned is not needed :)
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function mapOptionType(type: OptionType) {
	switch (type) {
		case OptionType.Flag: case OptionType.Boolean: return ApplicationCommandOptionTypes.BOOLEAN;
		case OptionType.String: return ApplicationCommandOptionTypes.STRING;
		case OptionType.Integer: return ApplicationCommandOptionTypes.INTEGER;
		case OptionType.Number: return ApplicationCommandOptionTypes.NUMBER;
		case OptionType.User: return ApplicationCommandOptionTypes.USER;
		case OptionType.Role: return ApplicationCommandOptionTypes.ROLE;
		case OptionType.Channel: return ApplicationCommandOptionTypes.CHANNEL;
		case OptionType.Snowflake: return ApplicationCommandOptionTypes.STRING;
		case OptionType.Duration: return ApplicationCommandOptionTypes.STRING;
	}

	requireExhaustiveSwitch(type);
}

class SlashContext implements CommandContext {
	_interaction: CommandInteraction<AnyTextableGuildChannel>;
	_responseID: string | null;
	_acked: boolean;
	_deferTimeout: NodeJS.Timeout | null;
	_deferPromise: Promise<void> | null;
	_ephemeral: boolean;

	command: Command;
	get ephemeral(): boolean { return this._ephemeral; }

	get shard(): Shard { return this._interaction.guild.shard; }
	get guild(): Guild { return this._interaction.guild; }
	get user(): User { return this._interaction.user; }
	get member(): Member { return this._interaction.member; }
	get channel(): AnyTextableGuildChannel { return this._interaction.channel; }

	constructor(command: Command, interaction: CommandInteraction<AnyTextableGuildChannel>, ephemeral: boolean) {
		this.command = command;
		this._interaction = interaction;
		this._responseID = null;
		this._acked = false;
		this._deferPromise = null;
		this._deferTimeout = setTimeout(() => {
			this._deferTimeout = null;
			this._acked = true;
			this._deferPromise = interaction.defer(this._ephemeral ? MessageFlags.EPHEMERAL : 0).then();
		}, Math.max(0, AUTO_DEFER_AFTER - (Date.now() - interaction.createdAt.getTime()))).unref();
		this._ephemeral = ephemeral;
	}

	async respond(reply: Reply): Promise<void> {
		const messageOptions = transformReply(reply);

		if (this._ephemeral)
			messageOptions.flags |= MessageFlags.EPHEMERAL;
		else
			messageOptions.flags &= ~MessageFlags.EPHEMERAL;

		if (this._acked) {
			await this._deferPromise;

			if (this._responseID !== null)
				unlistenForInteractions(this._responseID);

			await this._interaction.editOriginal(messageOptions).then(message => this._responseID ??= message?.id ?? null);
		} else {
			this._clearTimeout();
			await this._interaction.reply(messageOptions).then(
				({ callback }) => this._responseID ??= callback?.resource?.message?.id ?? null
			);
			this._acked = true;
		}

		if (typeof reply !== "string" && reply.componentHandler !== undefined && this._responseID !== null)
			listenForInteractions(this._responseID, this._interaction.user.id, reply.componentHandler);
	}

	_clearTimeout(): void {
		if (this._deferTimeout !== null) {
			clearTimeout(this._deferTimeout);
			this._deferTimeout = null;
		}
	}
}

