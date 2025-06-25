import { escapeMarkdown, makeMarkdownInlineCodeblock } from "#common/discord/markdown.ts";
import type { CommandCacheEntry } from "#plugin/core/discord/commandEngine/commandCache.ts";
import { coreConfigStore } from "#plugin/core/index.ts";
import { type ReplyObject } from "#plugin/core/public/discord/command.ts";
import { Container, Divider, Text } from "oceanic-component-helper";

export function renderCommandPage(guildID: string, entry: CommandCacheEntry): ReplyObject {
	const { command } = entry;

	const container = Container([Text("## " + entry.command.name[0])]);

	if (command.description !== undefined)
		container.components.push(Text(escapeMarkdown(command.description)));

	if (command.supportPrefix ?? true) {
		container.components.push(Divider());

		const prefix = coreConfigStore.get(guildID)?.prefix_commands.prefix ?? "";

		let content = "**Usage:** " + makeMarkdownInlineCodeblock(prefix + command.name[0] + entry.usage);

		if (command.name.length > 1)
			content += "\n**Aliases:** " + command.name.slice(1).map(name => makeMarkdownInlineCodeblock(prefix + name)).join(", ");

		container.components.push(Text(content));
	}

	if (entry.optionsByName.size !== 0) {
		container.components.push(Divider());
		container.components.push(Text(formatOptions(entry)));
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
