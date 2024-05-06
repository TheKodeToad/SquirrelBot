import { AnyTextableChannel, ApplicationCommandOptionTypes, ApplicationCommandTypes, CommandInteraction, CreateApplicationCommandOptions, Guild, Interaction, Member, Shard, User } from "oceanic.js";
import { bot } from "..";
import { install_wrapped_listener } from "./event_filter";
import { get_all_commands, get_commands } from "./plugin_registry";
import { Command, Context, Option, OptionType, Reply } from "./types/command";

export async function install_slash_engine(): Promise<void> {
	const commands = get_all_commands().map(command => (
		{
			type: ApplicationCommandTypes.CHAT_INPUT,
			name: typeof command.id === "string" ? command.id : command.id[0],
			description: "command",
			options: command.options ? Object.values(command.options).map(flag => (
				{
					name: typeof flag.id === "string" ? flag.id : flag.id[0],
					description: "option",
					required: flag.required && !("default" in flag && flag.default),
					type: map_flag_type(flag.type),
				}
			)) : [],
		}
	)) as CreateApplicationCommandOptions[];
	await bot.application.bulkEditGlobalCommands(commands);

	install_wrapped_listener("interactionCreate", interaction_create);
}

function map_flag_type(type: OptionType): ApplicationCommandOptionTypes {
	switch (type) {
		case OptionType.VOID:
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
}

async function interaction_create(interaction: Interaction): Promise<void> {
	if (!interaction.isCommandInteraction())
		return;

	const matches = get_commands(interaction.data.name).filter(command => command.support_slash ?? true);

	if (matches.length !== 1)
		return;

	const command = matches[0]!;
	const context = new SlashContext(
		command,
		interaction as CommandInteraction<AnyTextableChannel>,
		interaction.guild?.shard ?? bot.shards.get(0)!
	);

	const args: Record<string, any> = {};

	if (command.options !== undefined) {
		const option_lookup = new Map<string, [string, Option]>;

		for (const [key, option] of Object.entries(command.options)) {
			args[key] = option.array ? [] : null;

			const id = Array.isArray(option.id) ? option.id[0] : option.id;
			option_lookup.set(id, [key, option]);
		}

		for (const slash_option of interaction.data.options.raw) {
			if (!("value" in slash_option))
				continue;

			if (!option_lookup.has(slash_option.name))
				continue;

			const [key, option] = option_lookup.get(slash_option.name)!;
			args[key] = option.array ? [slash_option.value] : slash_option.value;
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

