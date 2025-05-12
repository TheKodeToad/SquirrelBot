import { ButtonStyles, ComponentTypes, MessageFlags, type SelectOption } from "oceanic.js";
import { moduleLogger } from "../../../../../common/logger/index.ts";
import { makeMarkdownInlineCodeblock } from "../../../../common/discord/markdown.ts";
import { getPlugin, getPlugins } from "../../../../loader/index.ts";
import { getCommandByName } from "../../commandEngine/commandCache.ts";
import { canRunCommand } from "../../helper/commands.ts";
import { ActionRow, Container, Separator, Text } from "../../helper/componentSugar.ts";
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
			Text("**Select a plugin to view commands**"),
			ActionRow([
				renderPluginSelection(null, guildID, async (context, value) => {
					const page = renderCommandListPage(context, { plugin: value, page: 0 });
					page.flags ??= MessageFlags.EPHEMERAL;
					await context.respond(page);
				})
			]),
			Text(`${icons.tip} You can also pass in the name of a command to view it directly.`)
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
			components: [Text(`${icons.error} No such plugin - '${state.plugin}'!`)]
		};
	}

	const container = Container([Text("## Help")]);

	container.components.push(ActionRow([
		renderPluginSelection(state.plugin, context.guild.id, async (context, value) => {
			await context.edit(renderCommandListPage(context, { plugin: value, page: 0 }));
		})
	]));

	let entries = state.entries;

	if (entries === undefined) {
		entries = [];

		const prefix = coreConfig.get(context.guild.id)?.prefix_commands.prefix ?? "";

		for (const command of plugin.commands ?? []) {
			if (!((command.supportPrefix ?? true) || (command.supportSlash ?? true)))
				continue;

			if (!canRunCommand(command, context.member, context.channel))
				continue;

			const summaryComponent = Text("### " + command.name[0] + "\n");

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
					Text("**Usage:** " + makeMarkdownInlineCodeblock(prefix + command.name[0] + entry.usage)),
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
		container.components.push(Separator());
		container.components.push(...entry);
	}

	if (entries.length === 0) {
		container.components.push(Text(`**${icons.info} You do not have access to any commands for this plugin!**`));
		return { components: [container] };
	}

	const prevDisabled = sliceStart === 0;
	const nextDisabled = sliceEnd >= entries.length;

	container.components.push(Separator());

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

		container.components.push(ActionRow([prevButton, nextButton]));
	}

	container.components.push(Text("-# Optional options are surrounded with []."));

	return { components: [container] };
}
