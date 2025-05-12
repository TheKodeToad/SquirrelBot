import { ButtonStyles, ComponentTypes, MessageFlags, type SelectOption, type TextDisplayComponent } from "oceanic.js";
import { moduleLogger } from "../../../../../common/logger/index.ts";
import { makeMarkdownInlineCodeblock } from "../../../../common/discord/markdown.ts";
import { getPlugin, getPlugins } from "../../../../loader/index.ts";
import { getCommandByName } from "../../commandEngine/commandCache.ts";
import { canRunCommand } from "../../helper/commands.ts";
import { coreConfig } from "../../index.ts";
import type { BaseContext, CommandContainerComponent, CommandSelectMenuComponent, CommandTextButton, ComponentContext, Reply, ReplyObject } from "../../public/command.ts";
import { icons } from "../../public/icons.ts";

const logger = moduleLogger();

interface CommandListState {
	plugin: string;
	page: number;
	entries?: CommandContainerComponent["components"][];
}

export function renderCommandListPageMinimal(guildID: string): Reply {
	return {
		components: [
			{
				content: "**Select a plugin to view commands**",
				type: ComponentTypes.TEXT_DISPLAY,
			},
			{
				components: [
					renderPluginSelection(null, guildID, async (context, value) => {
						const page = renderCommandListPage(context, { plugin: value, page: 0 });
						page.flags ??= MessageFlags.EPHEMERAL;
						await context.respond(page);
					})
				],
				type: ComponentTypes.ACTION_ROW,
			},
			{
				content: `${icons.tip} You can also pass in the name of a command to view it directly.`,
				type: ComponentTypes.TEXT_DISPLAY,
			},
		],
	};
}

export function renderPluginSelection(selected: string | null, guildID: string, callback: (context: ComponentContext, value: string) => Promise<void>): CommandSelectMenuComponent {
	const options: SelectOption[] = [];

	for (const plugin of getPlugins()) {
		if (!(plugin.config === undefined || plugin.config.store.has(guildID)))
			continue;

		options.push({
			label: plugin.name,
			value: plugin.id,
			description: plugin.description,
			default: selected === plugin.id,
		});
	}

	return {
		customID: "plugin",
		options,
		type: ComponentTypes.STRING_SELECT,
		async callback(context, values) {
			await callback(context, values[0]!);
		},
	};
}

export function renderCommandListPage(context: BaseContext, state: CommandListState): ReplyObject {
	const plugin = getPlugin(state.plugin);

	if (plugin === undefined) {
		return {
			components: [{ content: `${icons.error} No such plugin - '${state.plugin}'!`, type: ComponentTypes.TEXT_DISPLAY }]
		};
	}

	const container: CommandContainerComponent = {
		components: [],
		type: ComponentTypes.CONTAINER,
	};

	container.components.push({
		content: "## Help",
		type: ComponentTypes.TEXT_DISPLAY,
	});

	container.components.push({
		components: [
			renderPluginSelection(state.plugin, context.guild.id, async (context, value) => {
				await context.edit(renderCommandListPage(context, { plugin: value, page: 0 }));
			})
		],
		type: ComponentTypes.ACTION_ROW,
	});

	let entries = state.entries;

	if (entries === undefined) {
		entries = [];

		const prefix = coreConfig.get(context.guild.id)?.prefix_commands.prefix ?? "";

		for (const command of plugin.commands ?? []) {
			if (!((command.supportPrefix ?? true) || (command.supportSlash ?? true)))
				continue;

			if (!canRunCommand(command, context.member, context.channel))
				continue;

			const summaryComponent: TextDisplayComponent = {
				content: "### " + command.name[0] + "\n",
				type: ComponentTypes.TEXT_DISPLAY,
			};

			if (command.description !== undefined)
				summaryComponent.content += command.description + "\n";

			const entry = getCommandByName(command.name[0]);

			if (entry === undefined) {
				logger.warn?.(`Command '${command.name[0]}' not cached!`);
				continue;
			}

			if (command.supportPrefix ?? true) {
				entries.push([
					summaryComponent,
					{ content: "**Usage:** " + makeMarkdownInlineCodeblock(prefix + command.name[0] + entry.usage), type: ComponentTypes.TEXT_DISPLAY },
				]);
			}
			else
				entries.push([summaryComponent]);
		}
	}

	const sliceStart = state.page * 5;
	const sliceEnd = sliceStart + 5;

	const visibleEntries = entries.slice(sliceStart, sliceEnd);

	for (const entry of visibleEntries) {
		container.components.push({ type: ComponentTypes.SEPARATOR });
		container.components.push(...entry);
	}

	if (entries.length === 0) {
		container.components.push({
			content: `**${icons.info} You do not have access to any commands for this plugin!**`,
			type: ComponentTypes.TEXT_DISPLAY,
		});
		return { components: [container] };
	}

	const prevDisabled = sliceStart === 0;
	const nextDisabled = sliceEnd >= entries.length;

	container.components.push({ type: ComponentTypes.SEPARATOR });

	if (!prevDisabled || !nextDisabled) {
		const prevButton: CommandTextButton = {
			label: "←",
			customID: "prev",
			disabled: prevDisabled,
			style: ButtonStyles.SECONDARY,
			type: ComponentTypes.BUTTON,
			async callback(context) {
				await context.edit(renderCommandListPage(context, { plugin: state.plugin, entries, page: state.page - 1 }));
			},
		};

		const nextButton: CommandTextButton = {
			label: "→",
			customID: "next",
			disabled: nextDisabled,
			style: ButtonStyles.SECONDARY,
			type: ComponentTypes.BUTTON,
			async callback(context) {
				await context.edit(renderCommandListPage(context, { plugin: state.plugin, entries, page: state.page + 1 }));
			},
		};

		container.components.push({
			components: [prevButton, nextButton],
			type: ComponentTypes.ACTION_ROW,
		});
	}

	container.components.push({
		content: "-# Optional options are surrounded with [].",
		type: ComponentTypes.TEXT_DISPLAY,
	});

	return { components: [container] };
}
