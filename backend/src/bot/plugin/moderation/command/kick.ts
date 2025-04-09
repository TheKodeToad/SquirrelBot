import type { CreateMessageOptions } from "oceanic.js";
import { CaseType } from "../../../../db/moderation/cases.ts";
import { escape_markdown } from "../../../common/discord/markdown.ts";
import { permissions_guard } from "../../core/public/command/helper.ts";
import { OptionType, define_command } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";
import { do_batch_action } from "../helper/batch_action.ts";
import { moderation_config } from "../index.ts";

export const kick_command = define_command({
	name: ["kick"],
	options: {
		user: {
			type: OptionType.USER,
			name: ["user", "u"],
			array: true,
			required: true,
			position: 0,
		},
		reason: {
			type: OptionType.STRING,
			name: ["reason", "r"],
			position: 1,
		},
		dm: {
			type: OptionType.FLAG,
			name: ["dm", "d", "direct-message"],
			negative_name: ["no-dm", "nd", "no-direct-message"],
		},
	},

	pre_run: context => permissions_guard(context, moderation_config, permissions => permissions.kick),
	async run(context, args, { config }) {
		const send_direct_message = args.dm ?? config.ban.send_direct_message;
		const direct_message: CreateMessageOptions | undefined =
			send_direct_message ?
				config.ban.direct_message ?? {
					content: `You were kicked from ${escape_markdown(context.guild.name)}.`
				} :
				undefined;

		const { successful, unsuccessful } = await do_batch_action({
			guild: context.guild,
			ids: args.user,

			actor: context.member,
			direct_message,

			members_only: true,

			perform: async user => await context.guild.removeMember(user.id, args.reason ?? undefined),
			make_case(actor, target, dm_delivered) {
				return {
					type: CaseType.Kick,
					actor_id: actor,
					target_id: target,
					reason: args.reason ?? undefined,
					dm_delivered,
				};
			},
		});
		if (args.user.length === 1) {
			if (successful.length === 1) {
				const kick = successful[0]!;
				await context.respond(`${icons.success} Kicked <@${kick.id}> (${escape_markdown(kick.name)})${kick.dm_delivered ? " with direct message" : ""} [#${kick.case_number}]!`);
			} else if (unsuccessful.length === 1) {
				const kick = unsuccessful[0]!;
				await context.respond(`${icons.error} Could not kick <@${kick.id}> (${escape_markdown(kick.name ?? "<unknown>")}): ${escape_markdown(kick.error)}!`);
			}
		} else {
			const successful_message = successful.map(kick => `- <@${kick.id}> (${escape_markdown(kick.name)}) ${kick.dm_delivered ? " with direct message" : ""} [#${kick.case_number}]`).join("\n");
			const unsuccessful_message = unsuccessful.map(kick => `- <@${kick.id}> (${escape_markdown(kick.name ?? "<unknown>")}): ${escape_markdown(kick.error)}`).join("\n");

			if (unsuccessful.length === 0) {
				await context.respond(
					`${icons.success} Kicked all ${args.user.length} users:\n${successful_message}`
				);
			} else if (successful.length === 0) {
				await context.respond(
					`${icons.error} None of ${args.user.length} users were kicked:\n${unsuccessful_message}`
				);
			} else {
				await context.respond(
					`${icons.warning} Only ${successful.length} of ${args.user.length} kicks were successful!\n`
					+ `Successful kicks:\n${successful_message}\n`
					+ `Unsuccessful kicks:\n${unsuccessful_message}`
				);
			}
		}
	},
});
