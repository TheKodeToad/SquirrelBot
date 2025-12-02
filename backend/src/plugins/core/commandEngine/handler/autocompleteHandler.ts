import { debugFormatPermissionContext } from "#common/discord/debugFormat.ts";
import { moduleLogger } from "#common/logger/index.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { getCommandByName } from "#plugins/core/commandEngine/commandCache.ts";
import { safePreRun } from "#plugins/core/helper/commands.ts";
import { coreConfigStore } from "#plugins/core/index.ts";
import {
	type AutocompleteContext,
	type Command,
} from "#plugins/core/public/command.ts";
import { onBotEvent } from "#plugins/core/public/extensionPoints.ts";
import { resolvePermissions } from "#plugins/core/public/permissionResolution.ts";
import {
	ApplicationCommandOptionTypes,
	type AnyInteractionGateway,
	type AnyTextableGuildChannel,
	type AutocompleteInteraction,
	type Client,
	type Guild,
	type Member,
	type Shard,
	type User,
} from "oceanic.js";

export default [onBotEvent({ type: "interactionCreate", listener: handle })];

const logger = moduleLogger();

async function handle(
	squirrelCtx: SquirrelDiscordContext,
	interaction: AnyInteractionGateway,
): Promise<void> {
	if (!interaction.inCachedGuildChannel()) {
		return;
	}

	if (!interaction.isAutocompleteInteraction()) {
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
			`Received autocomplete interaction for unknown slash command - '${interaction.data.name}' is not internally known`,
		);
		return;
	}

	const ctx = new AutoCompleteContextImpl(
		squirrelCtx,
		commandEntry.command,
		interaction,
	);

	const data = safePreRun(ctx, commandEntry.command);

	if (data === false) {
		logger.debug?.(
			`Command '${interaction.data.name}' rejected context - ${debugFormatPermissionContext(ctx.member, ctx.channel)}`,
		);
		await interaction.result([{ name: "(forbidden)", value: "" }]);
		return;
	}

	const focusedOption = interaction.data.options.raw.find(
		(option) => option.focused === true,
	);

	if (focusedOption?.type !== ApplicationCommandOptionTypes.STRING) {
		return;
	}

	if (!commandEntry.optionsByName.has(focusedOption.name)) {
		return;
	}

	const [_, commandOption] = commandEntry.optionsByName.get(
		focusedOption.name,
	)!;

	if (
		commandOption.type !== "string" ||
		commandOption.autocomplete === undefined
	) {
		return;
	}

	try {
		const choices = await commandOption.autocomplete(
			ctx,
			focusedOption.value,
		);
		const result = choices
			.slice(0, 25)
			.filter((choice) => choice.length !== 0)
			.map((choice) => choice.slice(0, 100))
			.map((choice) => ({ name: choice, value: choice }));

		await interaction.result(result);
	} catch (error) {
		try {
			await interaction.result([
				{ name: "(failed to complete options)", value: "" },
			]);
		} catch (error2) {
			logger.error?.(
				"Error responding with error message for autocomplete",
				error2,
			);
		}
		throw error;
	}
}

class AutoCompleteContextImpl implements AutocompleteContext {
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

	_interaction: AutocompleteInteraction<AnyTextableGuildChannel>;

	constructor(
		squirrelCtx: SquirrelDiscordContext,
		command: Command,
		interaction: AutocompleteInteraction<AnyTextableGuildChannel>,
	) {
		this.squirrelCtx = squirrelCtx;
		this.command = command;
		this._interaction = interaction;
	}
}
