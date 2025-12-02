import { makeMarkdownInlineCodeblock } from "#common/discord/markdown.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { canRunCommand } from "#plugins/core/command.ts";
import { getCommandsByPlugin } from "#plugins/core/commandEngine/commandCache.ts";
import { coreConfigStore } from "#plugins/core/index.ts";
import type {
	ActionContext,
	Reply,
	ReplyObject,
} from "#plugins/core/public/command.ts";
import { defineConfig } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import {
	ActionRow,
	Container,
	Divider,
	StringSelect,
	Text,
	TextButton,
} from "oceanic-component-helper";
import {
	MessageFlags,
	type ContainerComponent,
	type StringSelectMenu,
} from "oceanic.js";

interface CommandListState {
	plugin: string;
	page: number;
	entries?: ContainerComponent["components"][];
}

export function renderCommandListPageMinimal(
	ctx: SquirrelDiscordContext,
	guildID: string,
): Reply {
	return {
		components: [
			Text("**Select a plugin to view commands**"),
			ActionRow([renderPluginSelection(ctx, null, guildID)]),
			Text(
				`${icons.tip} You can also pass in the name of a command to view it directly.`,
			),
		],
		async componentHandler(ctx, customID, values) {
			if (customID !== "plugin") {
				return;
			}

			if (values?.length !== 1) {
				throw new Error("Selected plugin not present");
			}

			const page = renderCommandListPage(ctx, {
				plugin: values[0]!,
				page: 0,
			});
			page.flags ??= MessageFlags.EPHEMERAL;
			await ctx.respond(page);
		},
	};
}

function renderPluginSelection(
	ctx: SquirrelDiscordContext,
	selected: string | null,
	guildID: string,
): StringSelectMenu {
	const select = StringSelect("plugin");

	for (const plugin of ctx.plugins.values()) {
		const config = defineConfig.contributions.get(plugin);

		if (config !== undefined && !config.store.has(guildID)) {
			continue;
		}

		select.options.push({
			label: plugin.name,
			value: plugin.id,
			description: plugin.description,
			default: selected === plugin.id,
		});
	}

	return select;
}

export function renderCommandListPage(
	ctx: ActionContext,
	state: CommandListState,
): ReplyObject {
	const plugin = ctx.squirrelCtx.plugins.get(state.plugin);

	if (plugin === undefined) {
		return {
			components: [
				Text(`${icons.error} No such plugin - '${state.plugin}'!`),
			],
		};
	}

	const container = Container([Text("## Help")]);

	container.components.push(
		ActionRow([
			renderPluginSelection(ctx.squirrelCtx, state.plugin, ctx.guild.id),
		]),
	);

	let entries = state.entries;

	if (entries === undefined) {
		entries = [];

		const prefix =
			coreConfigStore.get(ctx.guild.id)?.prefixCommands.prefix ?? "";

		for (const entry of getCommandsByPlugin(plugin.name) ?? []) {
			const { command } = entry;

			if (
				!(
					(command.supportPrefix ?? true) ||
					(command.supportSlash ?? true)
				)
			) {
				continue;
			}

			if (
				!canRunCommand(
					ctx.squirrelCtx,
					command,
					ctx.member,
					ctx.channel,
				)
			) {
				continue;
			}

			const summaryComponent = Text("### " + command.name[0] + "\n");

			if (command.description !== undefined) {
				summaryComponent.content += command.description + "\n";
			}

			if (command.supportPrefix ?? true) {
				entries.push([
					summaryComponent,
					Text(
						"**Usage:** " +
							makeMarkdownInlineCodeblock(
								prefix + command.name[0] + entry.usage,
							),
					),
				]);
			} else {
				entries.push([summaryComponent]);
			}
		}
	}

	const sliceStart = state.page * 5;
	const sliceEnd = sliceStart + 5;

	const visibleEntries = entries.slice(sliceStart, sliceEnd);

	for (const entry of visibleEntries) {
		container.components.push(Divider());
		container.components.push(...entry);
	}

	if (entries.length === 0) {
		container.components.push(
			Text(
				`**${icons.info} You do not have access to any commands for this plugin!**`,
			),
		);
	} else {
		const prevDisabled = sliceStart === 0;
		const nextDisabled = sliceEnd >= entries.length;

		container.components.push(Divider());

		if (!prevDisabled || !nextDisabled) {
			container.components.push(
				ActionRow([
					TextButton("←", "prev", { disabled: prevDisabled }),
					TextButton("→", "next", { disabled: nextDisabled }),
				]),
			);
		}

		container.components.push(
			Text("-# Optional options are surrounded with []."),
		);
	}

	return {
		components: [container],
		async componentHandler(ctx, customID, values) {
			if (ctx.originalUserID !== ctx.user.id) {
				return;
			}

			if (customID === "prev") {
				await ctx.edit(
					renderCommandListPage(ctx, {
						plugin: state.plugin,
						entries,
						page: state.page - 1,
					}),
				);
			} else if (customID === "next") {
				await ctx.edit(
					renderCommandListPage(ctx, {
						plugin: state.plugin,
						entries,
						page: state.page + 1,
					}),
				);
			} else if (customID === "plugin") {
				if (values?.length !== 1) {
					throw new Error("Selected plugin not present");
				}

				await ctx.edit(
					renderCommandListPage(ctx, {
						plugin: values[0]!,
						page: 0,
					}),
				);
			}
		},
	};
}
