import { definePluginRoutes } from "#http/extensionPoints.ts";
import { getPlugins } from "#loader/index.ts";
import { Hono } from "hono";

export default (): Hono => {
	const app = new Hono;

	app.get("/", context => context.json(
		getPlugins().map(plugin => ({
			id: plugin.id,
			name: plugin.name,
			description: plugin.description,
		}))
	));

	for (const plugin of getPlugins()) {
		const pluginRouter = new Hono;

		for (const setup of definePluginRoutes.contributions)
			setup(plugin, pluginRouter);

		app.route("/" + encodeURIComponent(plugin.id), pluginRouter);
	}

	return app;
};
