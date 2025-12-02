import { getCommandByName } from "#plugins/core/commandEngine/commandCache.ts";
import {
	renderCommandListPage,
	renderCommandListPageMinimal,
} from "#plugins/core/commands/help/list.ts";
import { renderCommandPage } from "#plugins/core/commands/help/show.ts";
import { coreConfigStore } from "#plugins/core/plugin.ts";
import { permissionsGuard } from "#plugins/core/public/commandGuards.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";

export default defineCommand({
	name: ["help"],
	description: "View available commands and prefixed usage information.",
	trackUpdates: true,
	ephemeralByDefault: true,

	options: {
		command: {
			type: "string",
			name: ["command", "c"],
			position: 0,
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			coreConfigStore,
			(permissions) => permissions.helpCommand,
		),
	async run(ctx, args) {
		if (args.command !== null) {
			const command = getCommandByName(args.command);

			if (command === undefined) {
				await ctx.respond(
					`${icons.error} No command named '${args.command}'!`,
				);
				return;
			}

			await ctx.respond(renderCommandPage(ctx.guild.id, command));
			return;
		}

		if (ctx.ephemeral ?? false) {
			await ctx.respond(
				renderCommandListPage(ctx, { page: 0, plugin: "core" }),
			);
		} else {
			await ctx.respond(
				renderCommandListPageMinimal(ctx.backendCtx, ctx.guild.id),
			);
		}
	},
});
