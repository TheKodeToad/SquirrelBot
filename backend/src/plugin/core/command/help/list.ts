import { makeMarkdownInlineCodeblock } from "#common/discord/markdown.ts";
import { getPlugin, getPlugins } from "#loader/index.ts";
import { getCommandsByPlugin } from "#plugin/core/commandEngine/commandCache.ts";
import { canRunCommand } from "#plugin/core/helper/commands.ts";
import { coreConfigStore } from "#plugin/core/index.ts";
import type { BaseContext, Reply, ReplyObject } from "#plugin/core/public/command.ts";
import { defineConfig } from "#plugin/core/public/extensionPoints.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { ActionRow, Container, Divider, StringSelect, Text, TextButton } from "oceanic-component-helper";
import { MessageFlags, type ContainerComponent, type StringSelectMenu } from "oceanic.js";

interface CommandListState {
	plugin: string;
	page: number;
	entries?: ContainerComponent["components"][];
}

export function renderCommandListPageMinimal(guildID: string): Reply {
	return {
		components: [
			Text("**Select a plugin to view commands**"),
			ActionRow([renderPluginSelection(null, guildID)]),
			Text(`${icons.tip} You can also pass in the name of a command to view it directly.`)
		],
		async componentHandler(context, customID, values) {
			if (customID !== "plugin")
				return;

			if (values?.length !== 1)
				throw new Error("Selected plugin not present");

			const page = renderCommandListPage(context, { plugin: values[0]!, page: 0 });
			page.flags ??= MessageFlags.EPHEMERAL;
			await context.respond(page);
		},
	};
}

function renderPluginSelection(selected: string | null, guildID: string): StringSelectMenu {
	const select = StringSelect("plugin");

	for (const plugin of getPlugins()) {
		const config = defineConfig.contributions.get(plugin);

		if (config !== undefined && !config.store.has(guildID))
			continue;

		select.options.push({
			label: plugin.name,
			value: plugin.id,
			description: plugin.description,
			default: selected === plugin.id,
		});
	}

	return select;
}

export function renderCommandListPage(context: BaseContext, state: CommandListState): ReplyObject {
	const plugin = getPlugin(state.plugin);

	if (plugin === undefined) {
		return {
			components: [Text(`${icons.error} No such plugin - '${state.plugin}'!`)]
		};
	}

	const container = Container([Text("## Help")]);

	container.components.push(ActionRow([renderPluginSelection(state.plugin, context.guild.id)]));

	let entries = state.entries;

	if (entries === undefined) {
		entries = [];

		const prefix = coreConfigStore.get(context.guild.id)?.prefix_commands.prefix ?? "";

		for (const entry of getCommandsByPlugin(plugin.name) ?? []) {
			const { command } = entry;

			if (!((command.supportPrefix ?? true) || (command.supportSlash ?? true)))
				continue;

			if (!canRunCommand(command, context.member, context.channel))
				continue;

			const summaryComponent = Text("### " + command.name[0] + "\n");

			if (command.description !== undefined)
				summaryComponent.content += command.description + "\n";

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
		container.components.push(Divider());
		container.components.push(...entry);
	}

	if (entries.length === 0)
		container.components.push(Text(`**${icons.info} You do not have access to any commands for this plugin!**`));
	else {
		const prevDisabled = sliceStart === 0;
		const nextDisabled = sliceEnd >= entries.length;

		container.components.push(Divider());

		if (!prevDisabled || !nextDisabled) {
			container.components.push(ActionRow([
				TextButton("←", "prev", { disabled: prevDisabled }),
				TextButton("→", "next", { disabled: nextDisabled }),
			]));
		}

		container.components.push(Text("-# Optional options are surrounded with []."));
	}

	return {
		components: [container],
		async componentHandler(context, customID, values) {
			if (context.originalUserID !== context.user.id)
				return;

			if (customID === "prev") {
				await context.edit(renderCommandListPage(context, {
					plugin: state.plugin,
					entries,
					page: state.page - 1,
				}));
			} else if (customID === "next") {
				await context.edit(renderCommandListPage(context, {
					plugin: state.plugin,
					entries,
					page: state.page + 1,
				}));
			} else if (customID === "plugin") {
				if (values?.length !== 1)
					throw new Error("Selected plugin not present");

				await context.edit(renderCommandListPage(context, {
					plugin: values[0]!,
					page: 0,
				}));
			}
		},
	};
}
