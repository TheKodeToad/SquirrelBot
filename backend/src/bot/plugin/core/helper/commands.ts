import { Text } from "oceanic-component-helper";
import { Member, MessageFlags, type AnyTextableGuildChannel } from "oceanic.js";
import { type Command, type Reply, type ReplyObject } from "../public/command.ts";

export function transformReply(reply: Reply): ReplyObject & { flags: number; } {
	if (typeof reply === "string") {
		reply = { components: [Text(reply)], };
	}

	reply.flags ??= 0;
	reply.flags |= MessageFlags.IS_COMPONENTS_V2;

	// need to do this to please typechecker
	return { ...reply, flags: reply.flags };
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
