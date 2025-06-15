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

	options: {
		command: {
			type: OptionType.String,
			name: ["command", "c"],
			position: 0,
		}
	},

	preRun: context => permissionsGuard(context, coreConfigStore, permissions => permissions.help_command),
	async run(context, args) {
		if (args.command !== null) {
			const command = getCommandByName(args.command);

			if (command === undefined) {
				await context.respond(`${icons.error} No command named '${args.command}'!`);
				return;
			}

			await context.respond(renderCommandPage(context.guild.id, command));
			return;
		}

		if (context.ephemeral ?? false)
			await context.respond(renderCommandListPage(context, { page: 0, plugin: "core" }));
		else
			await context.respond(renderCommandListPageMinimal(context.guild.id));
	},
});
