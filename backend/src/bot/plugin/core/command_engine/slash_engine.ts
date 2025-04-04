import { type AnyTextableGuildChannel, ApplicationCommandOptionTypes, ApplicationCommandTypes, CommandInteraction, type CreateApplicationCommandOptions, Guild, Member, Shard, User } from "oceanic.js";
import { bot } from "../../../index.ts";
import { core_config } from "../index.ts";
import { type Command, type CommandContext, type Option, OptionType, type Reply } from "../public/command/index.ts";
import { define_event_listener } from "../public/event_listener.ts";
import { resolve_permissions } from "../public/permission_resolution.ts";
import { get_commands, get_commands_by_name } from "./command_cache.ts";
import { AUTO_DEFER_AFTER, transform_reply } from "./index.ts";

export async function sync_slash_commands(): Promise<void> {
	const commands = get_commands().filter(command => command.support_slash ?? true).map(command => ({
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
	})) as CreateApplicationCommandOptions[];
	await bot.application.bulkEditGlobalCommands(commands);
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

export const slash_run_handler = define_event_listener("interactionCreate", async interaction => {
	if (!interaction.inCachedGuildChannel())
		return;

	if (!interaction.isCommandInteraction())
		return;

	const config = core_config.get(interaction.guildID);

	if (config === undefined)
		return;

	const perms = resolve_permissions(config, interaction.member, interaction.channel);

	if (!perms.slash_commands)
		return;

	const matches = get_commands_by_name(interaction.data.name).filter(command => command.support_slash ?? true);

	if (matches.length !== 1)
		return;

	const command = matches[0]!;
	const context = new SlashContext(command, interaction);

	const data = command.pre_run(context);

	if (data === false) {
		context._abandon();
		return;
	}

	if (data == null)
		throw new Error("Nullish value returned from pre_run!");

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
		await command.run(context, args, data);
	} catch (error) {
		await context.respond(`:boom: Failed to execute command`);
		throw error;
	} finally {
		context._abandon();
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
	_responded: boolean;
	_defer_timeout: NodeJS.Timeout | null;
	_defer_promise: Promise<void> | null;

	constructor(command: Command, interaction: CommandInteraction<AnyTextableGuildChannel>) {
		this.command = command;
		this._interaction = interaction;
		this._responded = false;
		this._defer_promise = null;
		this._defer_timeout = setTimeout(() => {
			this._defer_timeout = null;
			this._responded = true;
			this._defer_promise = interaction.defer();
		}, Math.max(0, AUTO_DEFER_AFTER - (Date.now() - interaction.createdAt.getTime()))).unref();
	}

	async respond(reply: Reply): Promise<void> {
		const message_options = transform_reply(reply);

		if (this._responded) {
			if (this._defer_promise !== null)
				await this._defer_promise;

			await this._interaction.editOriginal(message_options);
		} else {
			this._abandon();
			await this._interaction.reply(message_options);
			this._responded = true;
		}
	}

	_abandon() {
		if (this._defer_timeout !== null) {
			clearTimeout(this._defer_timeout);
			this._defer_timeout = null;
		}
	}
}

