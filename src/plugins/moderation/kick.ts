import { DiscordAPIError, PermissionFlagsBits, RESTJSONErrorCodes } from "discord.js";
import { FlagType, define_command } from "../../plugin/types";
import { escape_all } from "../../util/markdown";

export const kick_command = define_command({
	id: "kick",

	flags: {
		user: {
			type: FlagType.USER,
			id: "user",
			array: true,
			primary: true,
			required: true,
		},
		reason: {
			type: FlagType.STRING,
			id: "reason",
		},
		dm: {
			type: FlagType.VOID,
			id: "dm",
		},
		no_dm: {
			type: FlagType.VOID,
			id: ["no-dm", "!dm"],
		},
	},

	async run(args, context) {
		if (context.guild === null)
			return;

		if (!context.member?.permissions?.has(PermissionFlagsBits.KickMembers))
			return;

		let successful_kicks: { id: string, name: string, dm_sent: boolean; }[] = [];
		let unsuccessful_kicks: { id: string, name: string, error: string; }[] = [];

		for (const id of args.user) {
			let name: string;

			try {
				const target_member = await context.guild.members.fetch(id);
				name = target_member.user.tag;

				if (context.guild.ownerId !== context.user.id
					&& context.member.roles.highest.comparePositionTo(target_member.roles.highest) <= 0) {
					unsuccessful_kicks.push({ id, name, error: "Your highest role is not above target's highest role" });
					continue;
				}

				if (!target_member.moderatable) {
					unsuccessful_kicks.push({ id, name, error: "Bot's highest role is not above target's highest role" });
					continue;
				}
			} catch (error) {
				if (!(error instanceof DiscordAPIError))
					throw error;

				if (error.code !== RESTJSONErrorCodes.UnknownMember) {
					unsuccessful_kicks.push({ id, name: "<unknown>", error: error.message });
					continue;
				}

				try {
					const user = await context.client.users.fetch(id);
					unsuccessful_kicks.push({ id, name: user.tag, error: "User is not in the server" });
					continue;
				} catch (error) {
					if (!(error instanceof DiscordAPIError))
						throw error;

					unsuccessful_kicks.push({ id, name: "<unknown>", error: "User is not in the server" });
					continue;
				}
			}

			let dm_sent = false;

			if (!args.no_dm) {
				try {
					const dm = await context.client.users.createDM(id);
					await dm.send("You were kicked :regional_indicator_l:");
					dm_sent = true;
				} catch (error) {
					if (!(error instanceof DiscordAPIError))
						throw error;
				}
			}

			try {
				await context.guild.members.kick(id);
				successful_kicks.push({ id, name, dm_sent });
			} catch (error) {
				if (!(error instanceof DiscordAPIError))
					throw error;

				unsuccessful_kicks.push({ id, name, error: error.message });
			}
		}

		if (args.user.length === 1) {
			if (successful_kicks.length === 1) {
				const [kick] = successful_kicks;
				await context.respond(`:white_check_mark: Kicked <@${kick.id}> (${escape_all(kick.name)})${kick.dm_sent ? " with direct message" : ""}!`);
			} else if (unsuccessful_kicks.length === 1) {
				const [kick] = unsuccessful_kicks;
				await context.respond(`:x: Could not kick <@${kick.id}> (${escape_all(kick.name)}): ${kick.error}!`);
			}
		} else {
			const successful_message = successful_kicks.map(kick => `- <@${kick.id}> (${escape_all(kick.name)}) ${kick.dm_sent ? " with direct message" : ""}`).join("\n");
			const unsuccessful_message = unsuccessful_kicks.map(kick => `- <@${kick.id}> (${escape_all(kick.name)}): ${kick.error}`).join("\n");

			if (unsuccessful_kicks.length === 0) {
				await context.respond(
					`:white_check_mark: Kicked all ${args.user.length} users:\n${successful_message}`
				);
			} else if (successful_kicks.length === 0) {
				await context.respond(
					`:x: None of ${args.user.length} users were kicked:\n${unsuccessful_message}`
				);
			} else {
				await context.respond(
					`:warning: Only ${successful_kicks.length} of ${args.user.length} kicks were successful!\n`
					+ `Successful kicks:\n${successful_message}\n`
					+ `Unsuccessful kicks:\n${unsuccessful_message}`
				);
			}
		}
	}
});
