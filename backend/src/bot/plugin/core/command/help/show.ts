import { ComponentTypes } from "oceanic.js";
import { escapeMarkdown, makeMarkdownInlineCodeblock } from "../../../../common/discord/markdown.ts";
import type { CommandCacheEntry } from "../../commandEngine/commandCache.ts";
import { coreConfig } from "../../index.ts";
import { type CommandContainerComponent, type ReplyObject } from "../../public/command.ts";

export function renderCommandPage(guildID: string, entry: CommandCacheEntry): ReplyObject {
	const { command } = entry;

	const container: CommandContainerComponent = {
		components: [],
		type: ComponentTypes.CONTAINER,
	};

	container.components.push({
		content: "## " + entry.command.name[0],
		type: ComponentTypes.TEXT_DISPLAY,
	});

	if (command.description !== undefined) {
		container.components.push({
			content: escapeMarkdown(command.description),
			type: ComponentTypes.TEXT_DISPLAY
		});
	}

	if (command.supportPrefix ?? true) {
		container.components.push({ type: ComponentTypes.SEPARATOR });

		const prefix = coreConfig.get(guildID)?.prefix_commands.prefix ?? "";

		let content = "**Usage:** " + makeMarkdownInlineCodeblock(prefix + command.name[0] + entry.usage);

		if (command.name.length > 1)
			content += "\n**Aliases:** " + command.name.slice(1).map(name => makeMarkdownInlineCodeblock(prefix + name)).join(", ");

		container.components.push({ content, type: ComponentTypes.TEXT_DISPLAY });
	}

	if (entry.optionsByName.size !== 0) {
		container.components.push({ type: ComponentTypes.SEPARATOR });
		container.components.push({ content: formatOptions(entry), type: ComponentTypes.TEXT_DISPLAY });
	}

	return { components: [container] };
}

function formatOptions(entry: CommandCacheEntry): string {
	let result = "";

	for (const key in entry.command.options) {
		if (!Object.hasOwn(entry.command.options, key))
			continue;

		const option = entry.command.options[key]!;

		result += "**" + escapeMarkdown(option.name[0]);

		if ("negativeName" in option && option.negativeName !== undefined)
			result += "/" + escapeMarkdown(option.negativeName[0]);

		result += ":** ";

		if (option.description !== undefined)
			result += escapeMarkdown(option.description);
		else
			result += "*No description provided.*";

		result += "\n";
	}

	return result;
}
