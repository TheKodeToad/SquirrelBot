import { ButtonStyles, ComponentTypes, MessageFlags, type SelectOption } from "oceanic.js";
import { makeMarkdownInlineCodeblock } from "../../../common/discord/markdown.ts";
import { getPlugin, getPlugins } from "../../../loader/index.ts";
import { getCommandByName } from "../commandEngine/commandCache.ts";
import { canRunCommand } from "../helper/commands.ts";
import { coreConfig } from "../index.ts";
import { defineCommand, OptionType, type BaseContext, type CommandContainerComponent, type CommandSelectMenuComponent, type CommandTextButton, type ComponentContext, type Reply, type ReplyObject } from "../public/command.ts";
import { permissionsGuard } from "../public/helper/commandGuards.ts";
import { icons } from "../public/icons.ts";

export const helpCommand = defineCommand({
	name: ["help"],
	description: "View available commands and prefixed usage information.",
	trackUpdates: true,

	options: {
		command: {
			type: OptionType.String,
			name: ["command", "c"],
			position: 0,
		}
	},

	preRun: context => permissionsGuard(context, coreConfig, permissions => permissions.help_command),
	async run(context) {
		await context.respond(renderSelectPage());
	},
});

function renderPluginSelection(selected: string | null, callback: (context: ComponentContext, value: string) => Promise<void>): CommandSelectMenuComponent {
	const options: SelectOption[] = [];

	for (const plugin of getPlugins()) {
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

function renderSelectPage(): Reply {
	return {
		components: [
			{
				content: "**Select a plugin to view the commands of**",
				type: ComponentTypes.TEXT_DISPLAY,
			},
			{
				components: [
					renderPluginSelection(null, async (context, value) => {
						const page = renderCommandListPage(context, { plugin: value, page: 0 });
						page.flags ??= MessageFlags.EPHEMERAL;
						await context.respond(page);

						await context.edit(renderSelectPage());
					})
				],
				type: ComponentTypes.ACTION_ROW,
			}
		]
	};
}

interface CommandListState {
	plugin: string;
	page: number;
	entries?: string[];
}

function renderCommandListPage(context: BaseContext, state: CommandListState): ReplyObject {
	const plugin = getPlugin(state.plugin);

	if (plugin === undefined) {
		return {
			components: [{ content: `${icons.error} No such plugin - '${plugin}'!`, type: ComponentTypes.TEXT_DISPLAY }]
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
			renderPluginSelection(state.plugin, async (context, value) => {
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
			if (!(command.supportPrefix ?? true))
				continue;

			let summary = "### " + command.name[0] + "\n";

			if (!canRunCommand(command, context.member, context.channel)) {
				console.error("Cannot run " + command.name + "!");
				continue;
			}

			if (command.description !== undefined)
				summary += command.description + "\n";

			const entry = getCommandByName(command.name[0]);

			if (entry === undefined)
				throw new Error("Command in registered plugin not cached!");

			summary += "**Usage:** " + makeMarkdownInlineCodeblock(prefix + command.name[0] + entry.usage);

			entries.push(summary);
		}
	}

	const sliceStart = state.page * 5;
	const sliceEnd = sliceStart + 5;

	const visibleEntries = entries.slice(sliceStart, sliceEnd);

	for (const entry of visibleEntries) {
		container.components.push({
			content: entry,
			type: ComponentTypes.TEXT_DISPLAY,
		});
	}

	const prevDisabled = sliceStart === 0;
	const nextDisabled = sliceEnd >= entries.length;

	container.components.push({
		type: ComponentTypes.SEPARATOR,
		divider: false,
	});

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
