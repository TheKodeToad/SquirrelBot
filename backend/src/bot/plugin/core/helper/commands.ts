import { ComponentTypes, Member, MessageFlags, type AnyTextableGuildChannel } from "oceanic.js";
import { getCommandsByName } from "../commandEngine/commandCache.ts";
import { OptionType, type Command, type Option, type Reply } from "../public/command.ts";

export function transformReply(reply: Reply) {
	if (typeof reply === "string") {
		reply = {
			components: [{
				type: ComponentTypes.TEXT_DISPLAY,
				content: reply
			}],
		};
	}

	reply.flags ??= 0;
	reply.flags |= MessageFlags.IS_COMPONENTS_V2;

	return reply;
}

export function canRunCommand(command: Command, member: Member, channel: AnyTextableGuildChannel): boolean {
	const data = command.preRun({
		command,
		member,
		channel,
		user: member.user,
		guild: member.guild,
		shard: member.guild.shard,
		async respond() { },
	});

	if (data == null)
		throw new Error("Nullish value returned from preRun");

	return data !== false;
}

export function formatCommandUsage(command: Command, prefix: string): string {
	let result = prefix + command.name[0];

	if (command.options === undefined)
		return result;

	const entry = getCommandsByName(command.name[0]).find(entry => entry.command === command);

	if (entry === undefined)
		throw new Error(command.name + " is uncached");

	const alreadyDisplayed = new Set;

	for (const [key, option] of entry.optionsByPosition) {
		result += " ";

		if (!option.required)
			result += "[";

		result += "<" + option.name[0] + ">";

		if (!option.required)
			result += "]";

		alreadyDisplayed.add(key);
	}

	for (const key in command.options) {
		if (!Object.hasOwn(command.options, key))
			continue;

		if (alreadyDisplayed.has(key))
			continue;

		const option = command.options[key]!;

		result += " ";

		if (!option.required)
			result += "[";

		if ("negativeName" in option && option.negativeName !== undefined)
			result += "(-" + option.name[0] + "|-" + option.negativeName[0] + ")";
		else
			result += "-" + option.name[0];

		if (option.type !== OptionType.Flag)
			result += " <" + formatOptionValue(option) + ">";

		if (!option.required)
			result += "]";
	}

	return result;
}

function formatOptionValue(option: Option) {
	switch (option.type) {
		case OptionType.Boolean: return option.array ? "boolean(s)" : "(true|false)";
		case OptionType.Flag: return "";
		case OptionType.Integer: return option.array ? "whole number(s)" : "whole number";
		case OptionType.Number: return option.array ? "number(s)" : "number";
		case OptionType.String: return option.array ? "text value(s)" : "text";
		case OptionType.Snowflake: return option.array ? "snowflake(s)" : "snowflake";
		case OptionType.User: return option.array ? "user(s)" : "user";
		case OptionType.Role: return option.array ? "role(s)" : "role";
		case OptionType.Channel: return option.array ? "channel(s)" : "channel";
		case OptionType.Duration: return option.array ? "duration(s)" : "duration";
	}

}
