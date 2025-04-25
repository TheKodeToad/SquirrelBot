import { ButtonStyles, ComponentTypes } from "oceanic.js";
import { makeMarkdownInlineCodeblock } from "../../../common/discord/markdown.ts";
import { getPlugin, getPlugins } from "../../../loader/index.ts";
import { getCommandByName } from "../commandEngine/commandCache.ts";
import { canRunCommand } from "../helper/commands.ts";
import { coreConfig } from "../index.ts";
import { defineCommand, type BaseContext, type CommandContainerComponent, type CommandSelectMenuComponent, type CommandTextButton, type Reply } from "../public/command.ts";
import { permissionsGuard } from "../public/helper/commandGuards.ts";
import { icons } from "../public/icons.ts";

export const helpCommand = defineCommand({
	name: ["help"],
	description: "View available commands and prefixed usage information.",
	trackUpdates: true,

	preRun: context => permissionsGuard(context, coreConfig, permissions => permissions.help_command),
	async run(context) {
		await context.respond(renderMainPage(context, { selected: "core", page: 0 }));
	},
});

interface State {
	selected: string;
	page: number;
	entries?: string[];
}

function renderMainPage(context: BaseContext, state: State): Reply {
	const plugin = getPlugin(state.selected);

	if (plugin === undefined)
		return `${icons.error} No such plugin - '${plugin}'!`;

	const container: CommandContainerComponent = {
		components: [],
		type: ComponentTypes.CONTAINER,
	};

	container.components.push({
		content: "## Help",
		type: ComponentTypes.TEXT_DISPLAY,
	});

	const selection: CommandSelectMenuComponent = {
		customID: "plugin",
		options: [],
		type: ComponentTypes.STRING_SELECT,
		async callback(context, values) {
			await context.edit(renderMainPage(context, { selected: values[0]!, page: 0 }));
		},
	};

	for (const plugin of getPlugins()) {
		selection.options.push({
			label: plugin.name,
			value: plugin.id,
			description: plugin.description,
			default: state.selected === plugin.id,
		});
	}

	container.components.push({
		components: [selection],
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
				await context.edit(renderMainPage(context, { selected: state.selected, entries, page: state.page - 1 }));
			},
		};

		const nextButton: CommandTextButton = {
			label: "→",
			customID: "next",
			disabled: nextDisabled,
			style: ButtonStyles.SECONDARY,
			type: ComponentTypes.BUTTON,
			async callback(context) {
				await context.edit(renderMainPage(context, { selected: state.selected, entries, page: state.page + 1 }));
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
