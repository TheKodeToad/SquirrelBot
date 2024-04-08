import { APIApplicationCommand, APIGuildMember, APIInteractionGuildMember, ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Client, CommandInteractionOption, Guild, GuildMember, Interaction, InteractionType, Message, Routes, User } from "discord.js";
import { get_all_commands, get_commands } from "./registry";
import { Command, Context, Flag, FlagType, Reply } from "./types";

export async function install_slash_engine(client: Client) {
	const body = get_all_commands().map(command => (
		{
			name: typeof command.id === "string" ? command.id : command.id[0],
			description: "slash command :D",
			options: command.flags ? Object.values(command.flags).map(flag => (
				{
					name: typeof flag.id === "string" ? flag.id : flag.id[0],
					description: "option :O",
					required: flag.required && !("default" in flag && flag.default),
					type: map_flag_type(flag.type),
				}
			)) : []
		}
	));
	await client.rest.put(Routes.applicationCommands(client.application.id), { body });

	client.on("interactionCreate", interaction_create);
}

function map_flag_type(type: FlagType): ApplicationCommandOptionType {
	switch (type) {
		case FlagType.VOID:
			return ApplicationCommandOptionType.Boolean;
		case FlagType.BOOLEAN:
			return ApplicationCommandOptionType.Boolean;
		case FlagType.STRING:
			return ApplicationCommandOptionType.String;
		case FlagType.NUMBER:
			return ApplicationCommandOptionType.Number;
		case FlagType.USER:
			return ApplicationCommandOptionType.User;
		case FlagType.ROLE:
			return ApplicationCommandOptionType.Role;
		case FlagType.CHANNEL:
			return ApplicationCommandOptionType.Channel;
		case FlagType.SNOWFLAKE:
			return ApplicationCommandOptionType.Integer;
	}
}

class SlashContext implements Context {
	command: Command;
	user: User;
	member: GuildMember | APIInteractionGuildMember | null;
	guild: Guild;
	interaction: ChatInputCommandInteraction;

	constructor(command: Command, interaction: ChatInputCommandInteraction) {
		this.command = command;
		this.user = interaction.user;
		this.member = interaction.member;
		this.guild = interaction.guild;
		this.interaction = interaction;
	}

	async respond(reply: Reply) {
		this.interaction.reply(reply);
	}
}

async function interaction_create(interaction: Interaction) {
	if (!interaction.isChatInputCommand())
		return;

	const matches = get_commands(interaction.commandName).filter(command => command.support_slash ?? true);

	if (matches.length !== 1)
		return;

	const command = matches[0];
	const context = new SlashContext(command, interaction);

	const args = {};

	if (command.flags) {
		const flag_keys = new Map<string, string>;

		for (const [key, flag] of Object.entries(context.command.flags)) {
			const id = typeof flag.id === "string" ? flag.id : flag.id[0];
			flag_keys.set(id, key);

			if ("default" in flag)
				args[key] = flag.default;
		}

		for (const option of interaction.options.data) {
			if (!flag_keys.has(option.name))
				continue;

			const key = flag_keys.get(option.name);
			args[key] = option.value;
		}
	}

	await command.run(args, context);
}