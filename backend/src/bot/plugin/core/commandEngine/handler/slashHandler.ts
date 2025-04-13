import { type AnyTextableGuildChannel, ApplicationCommandOptionTypes, ApplicationCommandTypes, CommandInteraction, type CreateApplicationCommandOptions, Guild, Member, Shard, User } from "oceanic.js";
import { moduleLogger } from "../../../../../common/logger/index.ts";
import { requireExhaustiveSwitch } from "../../../../../common/types.ts";
import { debugFormatPermissionContext } from "../../../../common/discord/debugFormat.ts";
import { bot } from "../../../../index.ts";
import { coreConfig } from "../../index.ts";
import { type Command, type CommandContext, type Option, OptionType, type Reply } from "../../public/command/index.ts";
import { defineEventListener } from "../../public/eventListener.ts";
import { resolvePermissions } from "../../public/permissionResolution.ts";
import { getCommands, getCommandsByName } from "../commandCache.ts";
import { AUTO_DEFER_AFTER, transformReply } from "../index.ts";
import { listenForInteractions, unlistenForInteractions } from "./componentHandler.ts";

const logger = moduleLogger();

export async function syncSlashCommands(): Promise<void> {
	const commands = getCommands().filter(({ command }) => command.supportSlash ?? true).map(({ command }) => ({
		type: ApplicationCommandTypes.CHAT_INPUT,
		name: typeof command.name === "string" ? command.name : command.name[0],
		description: "command",
		options: command.options ? Object.values(command.options).map(options => (
			{
				name: options.name[0],
				description: "option",
				required: options.required,
				type: mapOptionType(options.type),
			}
		)) : [],
	} satisfies CreateApplicationCommandOptions));
	await bot.application.bulkEditGlobalCommands(commands);
}

function mapOptionType(type: OptionType) {
	switch (type) {
		case OptionType.FLAG:
		case OptionType.BOOLEAN:
			return ApplicationCommandOptionTypes.BOOLEAN;
		case OptionType.STRING:
			return ApplicationCommandOptionTypes.STRING;
		case OptionType.INTEGER:
			return ApplicationCommandOptionTypes.INTEGER;
		case OptionType.NUMBER:
			return ApplicationCommandOptionTypes.NUMBER;
		case OptionType.USER:
			return ApplicationCommandOptionTypes.USER;
		case OptionType.ROLE:
			return ApplicationCommandOptionTypes.ROLE;
		case OptionType.CHANNEL:
			return ApplicationCommandOptionTypes.CHANNEL;
		case OptionType.SNOWFLAKE:
			return ApplicationCommandOptionTypes.INTEGER;
	}

	requireExhaustiveSwitch(type);
}

export const slashRunHandler = defineEventListener("interactionCreate", async interaction => {
	if (!interaction.inCachedGuildChannel())
		return;

	if (!interaction.isCommandInteraction())
		return;

	const config = coreConfig.get(interaction.guildID);

	if (config === undefined)
		return;

	const perms = resolvePermissions(config, interaction.member, interaction.channel);

	if (!perms.slash_commands)
		return;

	const matches = getCommandsByName(interaction.data.name).filter(({ command }) => command.supportSlash ?? true);

	if (matches.length !== 1) {
		if (matches.length === 0)
			logger.warn?.(`Received event for unknown slash command - '${interaction.data.name}' is not internally known`);

		return;
	}

	const commandEntry = matches[0]!;
	const context = new SlashContext(commandEntry.command, interaction);

	const data = commandEntry.command.preRun(context);

	if (data === false) {
		logger.debug?.(`Command '${interaction.data.name}' rejected context - ${debugFormatPermissionContext(context.member, context.channel)}`);
		context._clear_timeout();
		return;
	}

	if (data == null)
		throw new Error("Nullish value returned from preRun!");

	const args: Record<string, any> = {};

	if (commandEntry.command !== undefined) {
		const optionLookup = new Map<string, [string, Option]>;

		for (const [key, option] of Object.entries(commandEntry.command.options ?? {})) {
			args[key] = option.array ? [] : null;
			optionLookup.set(option.name[0], [key, option]);
		}

		for (const slashOption of interaction.data.options.raw) {
			if (!("value" in slashOption))
				continue;

			if (!optionLookup.has(slashOption.name))
				continue;

			const [key, option] = optionLookup.get(slashOption.name)!;
			args[key] = option.array ? [slashOption.value] : slashOption.value;
		}
	}

	logger.debug?.(`Parsed arguments from options; running '${interaction.data.name}'`, args);

	try {
		await commandEntry.command.run(context, args, data);
	} catch (error) {
		await context.respond(`:boom: Failed to execute command`);
		throw error;
	} finally {
		context._clear_timeout();
	}
});

class SlashContext implements CommandContext {
	command: Command;
	get shard(): Shard { return this._interaction.guild.shard; }
	get guild(): Guild { return this._interaction.guild; }
	get user(): User { return this._interaction.user; }
	get member(): Member { return this._interaction.member; }
	get channel(): AnyTextableGuildChannel { return this._interaction.channel; }
	_interaction: CommandInteraction<AnyTextableGuildChannel>;
	_responseID: string | null;
	_acked: boolean;
	_deferTimeout: NodeJS.Timeout | null;
	_deferPromise: Promise<void> | null;

	constructor(command: Command, interaction: CommandInteraction<AnyTextableGuildChannel>) {
		this.command = command;
		this._interaction = interaction;
		this._responseID = null;
		this._acked = false;
		this._deferPromise = null;
		this._deferTimeout = setTimeout(() => {
			this._deferTimeout = null;
			this._acked = true;
			this._deferPromise = interaction.defer().then();
		}, Math.max(0, AUTO_DEFER_AFTER - (Date.now() - interaction.createdAt.getTime()))).unref();
	}

	async respond(reply: Reply): Promise<void> {
		const messageOptions = transformReply(reply);

		if (this._acked) {
			await this._deferPromise;

			if (this._responseID !== null)
				unlistenForInteractions(this._responseID);

			await this._interaction.editOriginal(messageOptions).then(message => this._responseID ??= message?.id ?? null);
		} else {
			this._clear_timeout();
			await this._interaction.reply(messageOptions).then(
				({ callback }) => this._responseID ??= callback?.resource?.message?.id ?? null
			);
		}

		if (typeof reply !== "string" && reply.components !== undefined && this._responseID !== null)
			listenForInteractions(this._responseID, this._interaction.user.id, reply.components);
	}

	_clear_timeout() {
		if (this._deferTimeout !== null) {
			clearTimeout(this._deferTimeout);
			this._deferTimeout = null;
		}
	}
}

