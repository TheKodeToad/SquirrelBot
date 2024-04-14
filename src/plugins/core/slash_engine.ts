import { Command, Context, Flag, FlagType, Reply, define_event_listener } from "../../plugin/types";
import { get_all_commands, get_commands, get_plugins } from "../../plugin/registry";
import { AnyInteractionChannel, AnyTextableChannel, ApplicationCommandOptionTypes, ApplicationCommandTypes, Client, CommandInteraction, CreateApplicationCommandOptions, Guild, Interaction, InteractionResponse, InteractionTypes, Member, User } from "oceanic.js";

export const slash_listener = define_event_listener("interactionCreate", interaction_create);

export async function register_slash_commands(client: Client): Promise<void> {
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
	await client.application.bulkEditGlobalCommands(commands);
}

function map_flag_type(type: FlagType): ApplicationCommandOptionTypes {
	switch (type) {
		case FlagType.VOID:
		case FlagType.BOOLEAN:
			return ApplicationCommandOptionTypes.BOOLEAN;
		case FlagType.STRING:
			return ApplicationCommandOptionTypes.STRING;
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

class SlashContext implements Context {
	command: Command;
	client: Client;
	user: User;
	member: Member | null;
	guild: Guild | null;
	channel: AnyInteractionChannel | null;
	#interaction: CommandInteraction;

	constructor(command: Command, interaction: CommandInteraction) {
		this.command = command;
		this.client = interaction.client;
		this.user = interaction.user;
		this.member = interaction.member ?? null;
		this.guild = interaction.guild;
		this.channel = interaction.channel ?? null;
		this.#interaction = interaction;
	}

	async respond(reply: Reply): Promise<void> {
		await this.#interaction.editOriginal(typeof reply === "string" ? { content: reply } : reply);
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

	await interaction.defer();

	const [command] = matches;
	const context = new SlashContext(command, interaction);

	const args: Record<string, any> = {};

	if (command.flags && data.options) {
		const flag_lookup = new Map<string, [string, Flag]>;

		for (const [key, flag] of Object.entries(command.flags)) {
			args[key] = flag.array ? [] : null;

			const id = typeof flag.id === "string" ? flag.id : flag.id[0];
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
		await command.run(args, context);
	} catch (error) {
		await context.respond(`:boom: Failed to execute /${command.id}`);
		throw error;
	}
}
