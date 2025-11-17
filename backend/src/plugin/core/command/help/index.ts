import { renderCommandListPage, renderCommandListPageMinimal } from "#plugin/core/command/help/list.ts";
import { renderCommandPage } from "#plugin/core/command/help/show.ts";
import { getCommandByName } from "#plugin/core/commandEngine/commandCache.ts";
import { coreConfigStore } from "#plugin/core/index.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";

export default defineCommand({
	name: ["help"],
	description: "View available commands and prefixed usage information.",
	trackUpdates: true,
	ephemeralByDefault: true,

	options: {
		command: {
			type: OptionType.String,
			name: ["command", "c"],
			position: 0,
		}
	},

	preRun: context => permissionsGuard(context, coreConfigStore, permissions => permissions.help_command),
	async run(ctx, args) {
		if (args.command !== null) {
			const command = getCommandByName(args.command);

			if (command === undefined) {
				await ctx.respond(`${icons.error} No command named '${args.command}'!`);
				return;
			}

			await ctx.respond(renderCommandPage(ctx.guild.id, command));
			return;
		}

		if (ctx.ephemeral ?? false)
			await ctx.respond(renderCommandListPage(ctx, { page: 0, plugin: "core" }));
		else
			await ctx.respond(renderCommandListPageMinimal(ctx.discordCtx, ctx.guild.id));
	},
});
