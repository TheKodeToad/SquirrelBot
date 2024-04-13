import { DiscordAPIError, GuildMember, PermissionFlagsBits, REST, RESTJSONErrorCodes, SnowflakeUtil } from "discord.js";
import { Context, FlagType, define_command } from "../../plugin/types";
import { escape_all } from "../../util/markdown";

export const ban_command = define_command({
	id: "ban",

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

		if (!context.member?.permissions?.has(PermissionFlagsBits.BanMembers))
			return;

		let successful_bans: { id: string, name: string, dm_sent: boolean; }[] = [];
		let unsuccessful_bans: { id: string, name: string, error: string; }[] = [];

		for (const id of args.user) {
			let name: string;
			let in_guild = false;

			try {
				const target_member = await context.guild.members.fetch(id);
				name = target_member.user.tag;
				in_guild = true;

				if (context.guild.ownerId !== context.user.id
					&& context.member.roles.highest.comparePositionTo(target_member.roles.highest) <= 0) {
					unsuccessful_bans.push({ id, name, error: "Your highest role is not above target's highest role" });
					continue;
				}

				if (!target_member.moderatable) {
					unsuccessful_bans.push({ id, name, error: "Bot's highest role is not above target's highest role" });
					continue;
				}
			} catch (error) {
				if (!(error instanceof DiscordAPIError))
					throw error;

				if (error.code !== RESTJSONErrorCodes.UnknownMember) {
					unsuccessful_bans.push({ id, name: "<unknown>", error: error.message });
					continue;
				}

				try {
					const user = await context.client.users.fetch(id);
					name = user.tag;
				} catch (error) {
					if (!(error instanceof DiscordAPIError))
						throw error;

					unsuccessful_bans.push({ id, name: "<unknown>", error: error.message });
					continue;
				}
			}

			let dm_sent = false;

			if (in_guild && !args.no_dm) {
				try {
					const dm = await context.client.users.createDM(id);
					await dm.send("You were banned :regional_indicator_l:");
					dm_sent = true;
				} catch (error) {
					if (!(error instanceof DiscordAPIError))
						throw error;
				}
			}

			try {
				await context.guild.bans.create(id, { reason: args.reason ?? undefined });
				successful_bans.push({ id, name, dm_sent });
			} catch (error) {
				if (!(error instanceof DiscordAPIError))
					throw error;

				unsuccessful_bans.push({ id, name, error: error.message });
			}
		}

		if (args.user.length === 1) {
			if (successful_bans.length === 1) {
				const [ban] = successful_bans;
				await context.respond(`:white_check_mark: Banned <@${ban.id}> (${escape_all(ban.name)})${ban.dm_sent ? " with direct message" : ""}!`);
			} else if (unsuccessful_bans.length === 1) {
				const [ban] = unsuccessful_bans;
				await context.respond(`:x: Could not ban <@${ban.id}> (${escape_all(ban.name)}): ${ban.error}!`);
			}
		} else {
			const successful_message = successful_bans.map(ban => `- <@${ban.id}> (${escape_all(ban.name)}) ${ban.dm_sent ? " with direct message" : ""}`).join("\n");
			const unsuccessful_message = unsuccessful_bans.map(ban => `- <@${ban.id}> (${escape_all(ban.name)}): ${ban.error}`).join("\n");

			if (unsuccessful_bans.length === 0) {
				await context.respond(
					`:white_check_mark: Banned all ${args.user.length} users:\n${successful_message}`
				);
			} else if (successful_bans.length === 0) {
				await context.respond(
					`:x: None of ${args.user.length} users were banned:\n${unsuccessful_message}`
				);
			} else {
				await context.respond(
					`:warning: Only ${successful_bans.length} of ${args.user.length} bans were successful!\n`
					+ `Successful bans:\n${successful_message}\n`
					+ `Unsuccessful bans:\n${unsuccessful_message}`
				);
			}
		}
	}
});
