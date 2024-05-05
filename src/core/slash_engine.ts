import { AnyTextableChannel, ApplicationCommandOptionTypes, ApplicationCommandTypes, CommandInteraction, CreateApplicationCommandOptions, Guild, Interaction, Member, Shard, User } from "oceanic.js";
import { bot } from "..";
import { install_wrapped_listener } from "./event_filter";
import { get_commands, get_plugins } from "./plugin_registry";
import { Command, Context, Flag, FlagType, Reply } from "./types/command";

export async function install_slash_engine(): Promise<void> {
	const commands = get_plugins().filter(plugin => plugin.commands !== undefined).map(plugin => (
		{
			type: ApplicationCommandTypes.CHAT_INPUT,
			name: plugin.id,
			description: "plugin",
			options: plugin.commands!.map(command => (
				{
					type: ApplicationCommandOptionTypes.SUB_COMMAND,
					name: typeof command.id === "string" ? command.id : command.id[0],
					description: "command",
					options: command.flags ? Object.values(command.flags).map(flag => (
						{
							name: typeof flag.id === "string" ? flag.id : flag.id[0],
							description: "option",
							required: flag.required && !("default" in flag && flag.default),
							type: map_flag_type(flag.type),
						}
					)) : [],
				}
			)),
		} as CreateApplicationCommandOptions
	));
	await bot.application.bulkEditGlobalCommands(commands);

	install_wrapped_listener("interactionCreate", interaction_create);
}

function map_flag_type(type: FlagType): ApplicationCommandOptionTypes {
	switch (type) {
		case FlagType.VOID:
		case FlagType.BOOLEAN:
			return ApplicationCommandOptionTypes.BOOLEAN;
		case FlagType.STRING:
			return ApplicationCommandOptionTypes.STRING;
		case FlagType.INTEGER:
			return ApplicationCommandOptionTypes.INTEGER;
		case FlagType.NUMBER:
			return ApplicationCommandOptionTypes.NUMBER;
		case FlagType.USER:
			return ApplicationCommandOptionTypes.USER;
		case FlagType.ROLE:
			return ApplicationCommandOptionTypes.ROLE;
		case FlagType.CHANNEL:
			return ApplicationCommandOptionTypes.CHANNEL;
		case FlagType.SNOWFLAKE:
			return ApplicationCommandOptionTypes.INTEGER;
	}
}

async function interaction_create(interaction: Interaction): Promise<void> {
	if (!interaction.isCommandInteraction())
		return;

	const [data] = interaction.data.options.raw;

	if (data?.type !== ApplicationCommandOptionTypes.SUB_COMMAND)
		return;

	const matches = get_commands(data.name).filter(command => command.support_slash ?? true);

	if (matches.length !== 1)
		return;

	const command = matches[0]!;
	const context = new SlashContext(
		command,
		interaction as CommandInteraction<AnyTextableChannel>,
		interaction.guild?.shard ?? bot.shards.get(0)!
	);

	const args: Record<string, any> = {};

	if (command.flags && data.options) {
		const flag_lookup = new Map<string, [string, Flag]>;

		for (const [key, flag] of Object.entries(command.flags)) {
			args[key] = flag.array ? [] : null;

			const id = Array.isArray(flag.id) ? flag.id[0] : flag.id;
			flag_lookup.set(id, [key, flag]);
		}

		for (const option of data.options) {
			if (!("value" in option))
				continue;

			if (!flag_lookup.has(option.name))
				continue;

			const [key, flag] = flag_lookup.get(option.name)!;
			args[key] = flag.array ? [option.value] : option.value;
		}
	}

	try {
		await command.run(context, args);
	} catch (error) {
		await context.respond(`:boom: Failed to execute /${command.id}`);
		throw error;
	} finally {
		context._remove_timeout();
	}
}

class SlashContext implements Context {
	command: Command;
	shard: Shard;
	guild: Guild | null;
	user: User;
	member: Member | null;
	channel_id: string;
	_interaction: CommandInteraction;
	_responded: boolean;
	_defer_timeout: NodeJS.Timeout | null;
	_defer_promise: Promise<void> | null;

	constructor(command: Command, interaction: CommandInteraction<AnyTextableChannel>, shard: Shard) {
		this.command = command;
		this.shard = shard;
		this.user = interaction.user;
		this.member = interaction.member ?? null;
		this.guild = interaction.guild;
		this.channel_id = interaction.channelID;

		this._interaction = interaction;
		this._responded = false;
		this._defer_promise = null;
		this._defer_timeout = setTimeout(() => {
			this._defer_timeout = null;
			this._responded = true;
			this._defer_promise = interaction.defer();
		}, 1000).unref();
	}

	async respond(reply: Reply): Promise<void> {
		const content = typeof reply === "string" ? { content: reply, flags: 0 } : { ...reply, flags: 0 };

		if (this._responded) {
			if (this._defer_promise !== null)
				await this._defer_promise;

			await this._interaction.editOriginal({
				attachments: [],
				components: [],
				content: "",
				embeds: [],
				files: [],
				...content,
			});
		} else {
			this._remove_timeout();
			await this._interaction.reply(content);
			this._responded = true;
		}
	}

	_remove_timeout() {
		if (this._defer_timeout !== null) {
			clearTimeout(this._defer_timeout);
			this._defer_timeout = null;
		}
	}
}

