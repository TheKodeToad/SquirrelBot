import { definePlugin } from "#plugin.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";

export default definePlugin({
	id: "demo",
	name: "Demo",
	description: "My demo plugin",

	contributions: [
		defineCommand({
			name: ["obama"],
			preRun: () => true,
			async run(ctx) {
				await ctx.respond("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBYPrz1TJso1TG81e36J4c6of-nvw6c8XQwA&s");
			}
		})
	]
});
